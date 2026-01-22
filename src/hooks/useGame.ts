import { useEffect, useState, useRef } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, set, update, onDisconnect } from 'firebase/database';
import { INITIAL_BASES } from '../types';
import type { Color, GameState, Base, BaseScore } from '../types';

// Check if we are using the placeholder config
const IS_DEMO = true; // For UI dev purposes, force DEMO mode. User can toggle this.
// In a real app we might check if generic placeholder values exist.


// Helper to calculate current scores based on snapshot + time delta
const calculateCurrentScores = (base: Base, now: number): BaseScore => {
    if (!base.heldBy || base.owner !== 'neutral') { // If owned, no more changes? User said "Up to maximum 100%". Once 100, is it locked? "someone to be able to go to 100% from 0%".
        // Let's assume if it's held, it changes. If owner is set, maybe it's locked until reset?
        // User said "capture the flag game logic to that base capturing logic..."
        // Usually CTF means once captured, it can be re-captured.
        // But the requirement says "communication only happens when new event... reached 100%".
        // If reached 100%, we set Owner. Does that mean it stops?
        // Let's assume if heldBy is set, it ticks, unless 100% is reached?
        // WE will handle the 100% check here.
        return { ...base.scores };
    }

    const elapsedSeconds = (now - base.lastInteraction) / 1000;
    if (elapsedSeconds <= 0) return { ...base.scores };

    const gainPerSecond = 10;
    const totalGain = elapsedSeconds * gainPerSecond;

    // Distribute logic
    // 1. Calculate new score for holder
    // 2. Distribute loss among others (proportional to their remaining score? "others should equally decrease")
    // User said "others should equally decrease".
    // Problem: If one is 0, they can't decrease.
    // Approach: Calculate total desired loss = totalGain.
    // Split total loss equally among NON-HOLDER teams.
    // If a team hits 0, they stop losing. Excess loss is NOT re-distributed in "equal decrease" usually, unless specified.
    // User said "others should equeally decrease ... Up to maximum 100% (minimum 0% for other teams) The sum of percentages must always add up to 100%."
    // To maintain Sum=100%, total GAIN must equal total LOSS.
    // If a loser hits 0, they can't lose more. So the winner cannot gain more than the sum of what losers can lose.

    const newScores = { ...base.scores };
    const holder = base.heldBy;
    const others = (Object.keys(newScores) as Color[]).filter(c => c !== holder);

    // Initial attempt: precise equal decrease
    // We iterate in small steps or handle the clamping mathematically.
    // Simple math:
    // Limit gain by max possible loss.
    let maxloss = 0;
    others.forEach(c => maxloss += newScores[c]);

    // Theoretical gain
    let actualGain = Math.min(totalGain, 100 - newScores[holder], maxloss);

    // Now distribute `actualGain` as loss among others.
    // "Equally decrease".
    // If we just subtract actualGain/3 from each, some might go below 0.
    // We need to drain them equally until 0.
    // Water-level algorithm (inverse).

    // Iterative approximation for simplicity (since strict formula is complex with clamping multiple):
    // Or better:
    // Sort others by score.
    // Take `actualGain`. remove `actualGain/3` from each.
    // If one hits 0, take remainder and split among remaining 2.
    // This ensures sum is constant.

    // Simple implementation:
    let remainingLossToInflict = actualGain;

    // We do a loop to drain
    // While loss > 0 and others have points
    for (let i = 0; i < 3; i++) { // Max 3 passes sufficient
        const validLosers = others.filter(c => newScores[c] > 0.001);
        if (validLosers.length === 0) break;

        const lossPerLoser = remainingLossToInflict / validLosers.length;
        let consumedLoss = 0;

        validLosers.forEach(c => {
            if (newScores[c] >= lossPerLoser) {
                newScores[c] -= lossPerLoser;
                consumedLoss += lossPerLoser;
            } else {
                // Determine how much they can lose
                const canLose = newScores[c];
                newScores[c] = 0;
                consumedLoss += canLose;
            }
        });

        remainingLossToInflict -= consumedLoss;
        if (remainingLossToInflict < 0.0001) break;
    }

    // Add the *actually inflicted* loss to the winner
    // (TotalGain was the target, but we only inflicted `actualGain - remainingLossToInflict`)
    const finalGain = actualGain - remainingLossToInflict;
    newScores[holder] += finalGain;

    return newScores;
};

export const useGame = (deviceId: string) => {
    // rawFromDB: The snapshot state from Firebase
    const [rawState, setRawState] = useState<GameState>({
        status: 'IDLE',
        endTime: 0,
        bases: INITIAL_BASES
    });

    // displayState: The interpolated state for UI
    const [gameState, setGameState] = useState<GameState>({
        status: 'IDLE',
        endTime: 0,
        bases: INITIAL_BASES
    });

    const demoStateRef = useRef<GameState>({
        status: 'IDLE',
        endTime: 0,
        bases: INITIAL_BASES
    });

    // Keep track of optimistic holding state to fix "lag" before Firebase RTT
    const optimisticHoldRef = useRef<{ baseId: string, color: Color | null, timestamp: number } | null>(null);

    // --- SYNC WITH DB / STORAGE ---
    useEffect(() => {
        if (IS_DEMO) {
            console.warn("Running in DEMO MODE (LocalStorage Sync)");
            const load = () => {
                const stored = localStorage.getItem('demo_gameState');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        setRawState(parsed);
                        demoStateRef.current = parsed;
                    } catch (e) {
                        console.error(e);
                    }
                } else {
                    localStorage.setItem('demo_gameState', JSON.stringify(demoStateRef.current));
                }
            };
            load();

            const handleStorage = (e: StorageEvent) => {
                if (e.key === 'demo_gameState' && e.newValue) load();
            };
            window.addEventListener('storage', handleStorage);

            // Also listen to local events (same tab)
            const handleLocal = () => load();
            window.addEventListener('local-storage-update', handleLocal);

            return () => {
                window.removeEventListener('storage', handleStorage);
                window.removeEventListener('local-storage-update', handleLocal);
            };
        }

        const gameRef = ref(db, 'gameState');
        const unsubscribe = onValue(gameRef, (snapshot) => {
            const data = snapshot.val();
            if (data) setRawState(data);
        });
        return () => unsubscribe();
    }, [deviceId]);


    // --- TICKER LOOP (Interpolation) ---
    useEffect(() => {
        let animationFrameId: number;

        const tick = () => {
            const now = Date.now();
            let hasHeldBase = false;

            const newBases = { ...rawState.bases };
            // For each base, calculate current score
            (Object.keys(newBases) as string[]).forEach(key => {
                const base = newBases[key];
                if (base.heldBy) {
                    hasHeldBase = true;
                    // Calculate interpolated scores
                    // We DO NOT mutate rawState.bases here deeply if used elsewhere, 
                    // but we are creating a new object structure for setGameState
                    const currentScores = calculateCurrentScores(base, now);

                    newBases[key] = {
                        ...base,
                        scores: currentScores
                    };
                }
            });

            if (hasHeldBase) {
                setGameState(prev => ({ ...prev, ...rawState, bases: newBases }));
            } else {
                setGameState(rawState);
            }

            animationFrameId = requestAnimationFrame(tick);
        };

        tick();
        return () => cancelAnimationFrame(animationFrameId);
    }, [rawState]); // Dependency on rawState: when DB updates, we re-base our calculations


    // --- ACTIONS ---

    const updateDemoState = (updates: Partial<GameState>) => {
        const newState = { ...demoStateRef.current, ...updates };
        demoStateRef.current = newState;
        setRawState(newState);
        localStorage.setItem('demo_gameState', JSON.stringify(newState));
        window.dispatchEvent(new Event('local-storage-update'));
    };

    const signalInteraction = async (baseId: string, action: 'START' | 'ABORT' | 'CAPTURE' | 'CHECK_CAPTURE', color: Color) => {
        const timestamp = Date.now();

        // Optimistic Update for UI smoothness (Lag Fix)
        if (action === 'START') {
            optimisticHoldRef.current = { baseId, color, timestamp };
            // Immediately update local state to reflect holding
            if (!IS_DEMO) {
                setRawState(prev => ({
                    ...prev,
                    bases: {
                        ...prev.bases,
                        [baseId]: { ...prev.bases[baseId], heldBy: color, lastInteraction: timestamp }
                    }
                }));
            }
        } else if (action === 'ABORT' || action === 'CAPTURE') {
            optimisticHoldRef.current = null;
            if (!IS_DEMO) {
                setRawState(prev => ({
                    ...prev,
                    bases: {
                        ...prev.bases,
                        [baseId]: {
                            ...prev.bases[baseId],
                            heldBy: null,
                            lastInteraction: timestamp,
                            owner: action === 'CAPTURE' ? color : prev.bases[baseId].owner
                        }
                    }
                }));
            }
        }

        if (IS_DEMO) {
            const currentBases = { ...demoStateRef.current.bases };
            const base = { ...currentBases[baseId] };
            if (!base) return;

            // Calculate final scores at this moment
            const finalScores = calculateCurrentScores(base, timestamp);

            if (action === 'START') {
                base.heldBy = color;
                base.scores = finalScores;
                base.lastInteraction = timestamp;
            } else if (action === 'ABORT') {
                if (base.heldBy === color) {
                    base.heldBy = null;
                    base.scores = finalScores;
                    base.lastInteraction = timestamp;
                }
            } else if (action === 'CAPTURE') {
                base.owner = color;
                base.heldBy = null;
                base.scores = finalScores;
                base.lastInteraction = timestamp;
            }

            currentBases[baseId] = base;
            updateDemoState({ bases: currentBases });
            return;
        }

        // Firebase - similar logic
        const basePath = `gameState/bases/${baseId}`;
        const base = rawState.bases[baseId];
        const finalScores = calculateCurrentScores(base, timestamp);

        const updates: any = {};
        if (action === 'START') {
            updates.heldBy = color;
            updates.lastInteraction = timestamp;
            updates.scores = finalScores;
        } else if (action === 'ABORT') {
            if (base.heldBy === color) {
                updates.heldBy = null;
                updates.lastInteraction = timestamp;
                updates.scores = finalScores;
            }
        } else if (action === 'CAPTURE') {
            updates.owner = color;
            updates.heldBy = null;
            updates.lastInteraction = timestamp;
            updates.scores = finalScores; // This confirms the 100%
        }

        if (Object.keys(updates).length > 0) {
            await update(ref(db, basePath), updates);
        }
    };

    const resetGame = async (durationMinutes: number) => {
        const endTime = Date.now() + durationMinutes * 60 * 1000;
        const newState: GameState = {
            status: 'IDLE',
            endTime: endTime, // Initial target time, will be reset on actual start
            bases: INITIAL_BASES
        };
        if (IS_DEMO) {
            updateDemoState(newState);
        } else {
            await set(ref(db, 'gameState'), newState);
        }
    };

    const startGame = async (durationMinutes: number = 15) => {
        // If IDLE or ENDED, start fresh
        // If PAUSED, resume (calculate new endTime based on remainingTime)

        let updates: Partial<GameState> = {};
        const now = Date.now();

        if (rawState.status === 'PAUSED' && rawState.remainingTime) {
            // Resume
            updates = {
                status: 'PLAYING',
                endTime: now + rawState.remainingTime,
                remainingTime: undefined // Clear it
            };
        } else {
            // Fresh Start
            updates = {
                status: 'PLAYING',
                endTime: now + durationMinutes * 60 * 1000
            };
        }

        if (IS_DEMO) updateDemoState(updates);
        else await update(ref(db, 'gameState'), updates);
    };

    const pauseGame = async () => {
        if (rawState.status !== 'PLAYING') return;

        const now = Date.now();
        const remaining = Math.max(0, rawState.endTime - now);

        const updates: Partial<GameState> = {
            status: 'PAUSED',
            remainingTime: remaining
        };

        if (IS_DEMO) updateDemoState(updates);
        else await update(ref(db, 'gameState'), updates);
    };

    const stopGame = async () => {
        if (IS_DEMO) {
            updateDemoState({ status: 'ENDED', heldBy: null }); // Clear holds? 
        }
        else await update(ref(db, 'gameState'), { status: 'ENDED' });
    };

    return {
        gameState, // The interpolated one
        signalInteraction,
        admin: {
            resetGame,
            startGame,
            pauseGame,
            stopGame
        }
    };
};
