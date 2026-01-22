import React from 'react';
import { useGame } from '../hooks/useGame';
import { ScorePieChart } from '../components/ScorePieChart';
import type { Base, Color } from '../types';

const COLORS: Color[] = ['red', 'green', 'blue', 'yellow'];
const COLOR_HEX: Record<Color, string> = {
    red: '#FF0000',
    green: '#00FF00',
    blue: '#0066FF',
    yellow: '#FFD700',
};

const SimulatorBaseCard = ({ base, onInteract }: { base: Base, onInteract: (action: 'START' | 'ABORT', color: Color) => void }) => {
    // Determine leading color for label styling
    const sorted = Object.entries(base.scores).sort((a, b) => b[1] - a[1]);
    const leaderKey = sorted[0][0] as Color;
    const leaderScore = sorted[0][1];

    // Determine Label Color: Team Color if Leading (>25), else White/Gray
    const labelColor = leaderScore > 25.1 ? COLOR_HEX[leaderKey] : '#E5E7EB';

    return (
        <div className="relative bg-gray-900 overflow-hidden flex items-center justify-center border-[4px] border-gray-800 rounded-[2rem] shadow-2xl w-full h-full">

            {/* Notch Label container */}
            <div className="absolute top-0 w-48 h-10 bg-black/60 backdrop-blur-md rounded-b-xl z-50 flex items-center justify-center border-b border-x border-white/10 shadow-lg gap-3">
                {/* Left Dot */}
                <div
                    className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                    style={{ backgroundColor: labelColor, color: labelColor }}
                />

                <span className="text-white font-bold font-mono text-lg tracking-widest uppercase drop-shadow-md">
                    {base.id.replace('_', ' ')}
                </span>

                {/* Right Dot */}
                <div
                    className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                    style={{ backgroundColor: labelColor, color: labelColor }}
                />
            </div>

            {/* Background Quadrants (Vibrant, No Overlay) */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                <div className="bg-[#FF0000] border-r border-b border-white/10" />
                <div className="bg-[#00FF00] border-b border-white/10" />
                <div className="bg-[#0066FF] border-r border-white/10" />
                <div className="bg-[#FFD700]" />
            </div>

            {/* Vignette & Pulse Animation (Active Hold) */}
            {base.heldBy && (
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div
                        className="absolute inset-0 animate-pulse transition-all duration-1000"
                        style={{
                            background: `radial-gradient(circle, transparent 30%, ${COLOR_HEX[base.heldBy]} 90%)`,
                            opacity: 0.9
                        }}
                    />
                </div>
            )}

            {/* Central Pie Chart */}
            <div className="relative z-10 scale-100">
                <ScorePieChart scores={base.scores} />
            </div>

            {/* Interaction Layer (Overlay Buttons - Invisible, No Hover) */}
            <div className="absolute inset-0 z-20 grid grid-cols-2 grid-rows-2 p-1 gap-1">
                {COLORS.map((color) => {
                    const isHolding = base.heldBy === color;
                    let positionClass = '';
                    if (color === 'red') positionClass = 'col-start-1 row-start-1';
                    if (color === 'green') positionClass = 'col-start-2 row-start-1';
                    if (color === 'blue') positionClass = 'col-start-1 row-start-2';
                    if (color === 'yellow') positionClass = 'col-start-2 row-start-2';

                    return (
                        <button
                            key={color}
                            className={`
                                ${positionClass}
                                rounded-3xl
                                flex items-center justify-center
                                outline-none focus:outline-none
                                active:scale-[0.98] transition-transform
                            `}
                            onMouseDown={() => onInteract('START', color)}
                            onMouseUp={() => onInteract('ABORT', color)}
                            onMouseLeave={() => isHolding && onInteract('ABORT', color)}
                            onTouchStart={(e) => { e.preventDefault(); onInteract('START', color); }}
                            onTouchEnd={(e) => { e.preventDefault(); onInteract('ABORT', color); }}
                        >
                            <span className={`
                                font-bold text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]
                                tracking-widest
                                ${isHolding ? 'opacity-100 scale-125 text-white' : 'opacity-0'}
                            `}>
                                {isHolding ? 'HOLDING...' : ''}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Old labels removed */}
        </div>
    );
};

export const Simulator: React.FC = () => {
    const { gameState, signalInteraction } = useGame('simulator-admin');

    const handleInteract = (baseId: string, action: 'START' | 'ABORT', color: Color) => {
        signalInteraction(baseId, action, color);
    };

    // Need to filter/sort bases to ensure consistent order? 
    // Assuming base_1 to base_4
    const bases = Object.values(gameState.bases).sort((a, b) => a.id.localeCompare(b.id));

    return (
        <div className="h-screen w-full bg-gray-950 text-white grid grid-cols-2 grid-rows-2 gap-2 p-2 box-border overflow-hidden">
            {bases.map(base => (
                <div key={base.id} className="w-full h-full min-h-0 min-w-0">
                    <SimulatorBaseCard
                        base={base}
                        onInteract={(action, color) => handleInteract(base.id, action, color)}
                    />
                </div>
            ))}
        </div>
    );
};
