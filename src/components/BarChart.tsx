import React from 'react';
import type { BaseScore, Color } from '../types';
import { getNormalizedScores } from '../utils/scoreUtils';

interface BarChartProps {
    scores: BaseScore;
}

const COLORS: Record<Color, string> = {
    red: '#FF0000',    // Vibrant Red
    green: '#00FF00',  // Vibrant Green
    blue: '#0066FF',   // Vibrant Blue
    yellow: '#FFD700', // Vibrant Yellow
};

export const BarChart: React.FC<BarChartProps> = ({ scores }) => {
    const max = 100;
    // Defined order for consistency side-by-side
    const colorOrder: Color[] = ['red', 'green', 'blue', 'yellow'];

    // Normalize scores to ensure they sum to 100 for display
    const normalizedScores = getNormalizedScores(scores);

    return (
        <div className="relative w-full h-full bg-gray-900/50 rounded-lg p-2 flex flex-col">
            {/* Chart Area with Grid and Axes */}
            <div className="relative flex-1 w-full border-l border-b border-gray-700 flex items-end justify-between px-2 pt-4">

                {/* Grid Lines (25, 50, 75, 100) */}
                <div className="absolute inset-0 pointer-events-none">
                    {[25, 50, 75, 100].map(y => (
                        <div
                            key={y}
                            className="absolute w-full border-t border-gray-700 border-dashed opacity-30"
                            style={{ bottom: `${y}%`, left: 0 }}
                        />
                    ))}
                </div>

                {colorOrder.map(color => {
                    // Use a slightly larger minimum for very small values so the bar is visible on the axis
                    const height = `${Math.max((scores[color] / max) * 100, 1)}%`;
                    // Use normalized integer score for text display
                    const displayScore = normalizedScores[color];

                    return (
                        <div key={color} className="relative h-full flex flex-col justify-end group w-1/5 mx-1">
                            {/* Bar Container */}
                            <div className="w-full flex items-end justify-center h-full relative z-10">
                                <div
                                    style={{ height, backgroundColor: COLORS[color] }}
                                    className="w-full transition-all duration-300 ease-out rounded-t-sm rounded-b-none opacity-90 hover:opacity-100 flex items-start justify-center overflow-visible"
                                >
                                    {/* Inner Value (Glass Box) - Only if bar is tall enough */}
                                    {displayScore >= 15 && (
                                        <div className="mt-2 text-[10px] font-bold text-white bg-gray-900/40 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 shadow-sm select-none pointer-events-none">
                                            {displayScore}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Outer Value (Glass Box) - If bar is short */}
                            {displayScore < 15 && displayScore > 0 && (
                                <div className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 z-20 pointer-events-none" style={{ bottom: height }}>
                                    <div className="text-[10px] font-bold text-white bg-gray-900/60 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 shadow-sm whitespace-nowrap">
                                        {displayScore}
                                    </div>
                                </div>
                            )}

                            {/* Zero Value Handling - Optional Visual? */}
                            {displayScore === 0 && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-gray-600 font-mono select-none">
                                    0
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Optional X Axis Labels? (Team Names or Colors? Blocks denote color, maybe redundant but clarity helps) */}
            <div className="flex w-full justify-between px-2 mt-1">
                {colorOrder.map(c => (
                    <div key={c} className="w-1/5 mx-1 text-center">
                        {/* Small color dot or implicit? Colors are obvious. */}
                    </div>
                ))}
            </div>
        </div>
    );
};
