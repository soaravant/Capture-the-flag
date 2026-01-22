import React, { useEffect, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { BarChart } from '../components/BarChart';
import type { Base, Color } from '../types';

const BaseStatusCard = ({ base }: { base: Base }) => {
    // Defined locally or imported to match BarChart exactly
    const COLORS: Record<Color, string> = {
        red: '#FF0000',
        green: '#00FF00',
        blue: '#0066FF',
        yellow: '#FFD700',
    };

    // Determine leader
    const entries = Object.entries(base.scores) as [Color, number][];
    const sorted = [...entries].sort((a, b) => b[1] - a[1]);
    const leader = sorted[0];
    const leadingTeam = leader[0];
    const leadingScore = leader[1];
    const isOwned = leadingScore >= 100;

    // Default styles
    let textColor = 'text-gray-400';
    let textHexColor: string | undefined = undefined;
    let dotClass = 'bg-gray-700';
    let dotHexColor: string | undefined = undefined;
    let statusText = 'NEUTRAL ZONE';

    // If there is a leader > 25%
    if (leadingScore > 25.1) {
        statusText = `${leadingTeam.toUpperCase()} TEAM`;
        // Use exact hex for text
        textHexColor = COLORS[leadingTeam];
        // Use exact hex for dot
        dotHexColor = COLORS[leadingTeam];
    }

    if (base.heldBy) {
        // Interaction overrides color? Or keeps team color but pulses?
        // User said "CONTESTED BY..." usually implies white/pulse or team color.
        // Let's stick to previous logical: "CONTESTED BY RED" -> White text + pulse?
        // Actually, user said "Make colros of <COLOR> TEAM title same...".
        // If holding, it says "CONTESTED BY...".
        // Let's keep the contested logic as white/pulse for high visibility interaction.
        textColor = 'text-white animate-pulse';
        textHexColor = undefined; // Override hex
        statusText = `CONTESTED BY ${base.heldBy.toUpperCase()}`;

        dotClass = 'bg-white animate-ping';
        dotHexColor = undefined;
    } else if (isOwned) {
        statusText = `${base.owner.toUpperCase()} SECURED`;
        // Keep owner color if owned
        if (base.owner !== 'neutral') {
            textHexColor = COLORS[base.owner];
            dotHexColor = COLORS[base.owner];
        }
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col shadow-lg hover:border-gray-700 transition-colors h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="overflow-hidden">
                    <h3 className="text-xs font-mono uppercase text-gray-500 tracking-wider mb-1">
                        SECTOR: {base.id.replace('_', ' ').toUpperCase()}
                    </h3>
                    <div
                        className={`text-xl font-bold text-nowrap ${!textHexColor ? textColor : ''}`}
                        style={{ color: textHexColor }}
                    >
                        {statusText}
                    </div>
                </div>

                {/* Status Dot */}
                <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ml-2 ${!dotHexColor ? dotClass : ''}`}
                    style={{ backgroundColor: dotHexColor }}
                />
            </div>

            {/* Bar Chart Visualization - Fill Remaining Space */}
            <div className="flex-1 w-full min-h-[150px]">
                <BarChart scores={base.scores} />
            </div>
        </div>
    );
};

export const AdminDashboard: React.FC = () => {
    const { gameState, admin } = useGame('admin-dashboard');
    const [timeLeft, setTimeLeft] = useState<string>('15:00');
    const [timerProgress, setTimerProgress] = useState<number>(100);

    useEffect(() => {
        // Initial set if needed
        if (gameState.status !== 'PLAYING' && gameState.status !== 'PAUSED') {
            setTimeLeft('15:00');
        }

        const timer = setInterval(() => {
            if (gameState.status === 'PLAYING') {
                const diff = gameState.endTime - Date.now();
                if (diff <= 0) {
                    setTimeLeft('00:00');
                    setTimerProgress(0);
                } else {
                    const m = Math.floor(diff / 60000);
                    const s = Math.floor((diff % 60000) / 1000);
                    setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
                    // Assume 15 min game for progress bar reference (15 * 60 * 1000 = 900000)
                    // Or ideally we store totalDuration in gameState but for now user said 15 min.
                    setTimerProgress((diff / 900000) * 100);
                }
            } else if (gameState.status === 'PAUSED' && gameState.remainingTime !== undefined) {
                const diff = gameState.remainingTime;
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
                setTimerProgress((diff / 900000) * 100);
            } else {
                setTimeLeft('15:00');
                setTimerProgress(100);
            }
        }, 1000);

        // Immediate update
        if (gameState.status === 'PLAYING') {
            const diff = gameState.endTime - Date.now();
            if (diff > 0) {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
                setTimerProgress((diff / 900000) * 100);
            }
        } else if (gameState.status === 'PAUSED' && gameState.remainingTime !== undefined) {
            const diff = gameState.remainingTime;
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            setTimerProgress((diff / 900000) * 100);
        }

        return () => clearInterval(timer);
    }, [gameState.status, gameState.endTime, gameState.remainingTime]);

    return (
        <div className="p-6 lg:p-10 h-full bg-gray-950 text-white overflow-y-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
                        <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Command Center</h1>
                        <p className="text-gray-500 text-sm">Real-time game monitoring</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4 bg-gray-900 p-2 rounded-lg border border-gray-800">
                    <div className="px-4 py-2 text-sm text-gray-400 border-r border-gray-800">
                        DURATION <span className="text-white font-mono ml-2">15 min</span>
                    </div>
                    <div className={`px-4 py-2 text-sm font-bold flex items-center ${gameState.status === 'PLAYING' ? 'text-green-500' : 'text-gray-500'}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${gameState.status === 'PLAYING' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                        {gameState.status}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left (or Top) Column: Timer & Controls */}
                <div className="lg:col-span-1 space-y-6 flex flex-col h-full">
                    {/* Timer Card */}
                    <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 group-hover:from-indigo-500/10 transition-colors" />
                        <h3 className="text-gray-500 font-mono text-xs uppercase tracking-widest mb-2">Game Timer</h3>
                        <div className="text-7xl font-bold font-mono tracking-tighter text-white tabular-nums mb-4">
                            {timeLeft}
                        </div>
                        {/* Progress Bar Container aligned with text width if needed, or full card width */}
                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden w-full">
                            <div
                                className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
                                style={{ width: `${timerProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Actions Card */}
                    {/* Actions Card */}
                    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
                        <h3 className="text-gray-500 font-mono text-xs uppercase tracking-widest mb-2">Actions</h3>

                        {/* Control Button Logic */}
                        {gameState.status === 'PLAYING' ? (
                            <button
                                onClick={() => admin.pauseGame()}
                                className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold shadow-lg shadow-yellow-900/20 transition-all active:scale-95 flex items-center justify-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>PAUSE GAME</span>
                            </button>
                        ) : gameState.status === 'PAUSED' ? (
                            <button
                                onClick={() => admin.startGame()} // Resume
                                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 transition-all active:scale-95 flex items-center justify-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>CONTINUE GAME</span>
                            </button>
                        ) : (
                            // IDLE or ENDED
                            <button
                                onClick={() => admin.startGame()}
                                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 transition-all active:scale-95 flex items-center justify-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>START GAME</span>
                            </button>
                        )}

                        {/* Stop Button (Ends game completely/Resets time flow?) User said: "say start and then say pause ... if I pause it should say continue". Stop button logic is different usually. 
                            The user complained about "when I press stop It says 15 min but when I press start it continues".
                            Current STOP implementation just updated status.
                            Let's keep Reset for hard reset.
                            Maybe we don't need a STOP button based on "Start -> Pause -> Continue"? 
                            User didn't explicitly ask for STOP, but mentioned "when pressing stop". 
                            I will keep RESET as the "Stop/Reset" action.
                        */}

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => admin.resetGame(15)}
                                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 border border-gray-700"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>RESET (15m)</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Base Status Grid (Now taking full row or spanning properly) */}
                <div className="lg:col-span-3 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-gray-500 font-mono text-xs uppercase tracking-widest">Base Control Status</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                        {Object.values(gameState.bases).map(base => (
                            <div key={base.id} className="h-full">
                                <BaseStatusCard base={base} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
