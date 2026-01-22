import React from 'react';
import type { Color } from '../types';
import { getNormalizedScores } from '../utils/scoreUtils';

interface ScorePieChartProps {
    scores: Record<Color, number>;
}

const COLORS: Record<Color, string> = {
    red: '#FF0000',    // Vibrant Red
    green: '#00FF00',  // Vibrant Green
    blue: '#0066FF',   // Vibrant Blue
    yellow: '#FFD700', // Vibrant Yellow
};

export const ScorePieChart: React.FC<ScorePieChartProps> = ({ scores }) => {
    // 1. Calculate total (should be approx 100, but normalize just in case)
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const normalizedScores = getNormalizedScores(scores);

    let cumulativePercent = 0;

    // SVG Geometry
    const size = 200;
    const center = size / 2;
    const radius = 60; // Inner chart radius
    const labelRadius = 85; // Radius to place labels/lines

    // Order to match standard quadrants (TL -> TR -> BR -> BL) starting from 9 o'clock
    const orderedColors: Color[] = ['red', 'green', 'yellow', 'blue'];

    // SVG standard: 0 is 3 o'clock. We want to start at 9 o'clock (180 deg or Math.PI)
    const START_ANGLE_OFFSET = Math.PI;

    const slices = orderedColors.map(color => {
        const percent = scores[color];
        if (percent <= 0) return null;

        // Calculate angles (in radians)
        const startPercent = cumulativePercent;
        cumulativePercent += percent;
        const endPercent = cumulativePercent;

        const startAngle = (startPercent / 100) * 2 * Math.PI + START_ANGLE_OFFSET;
        const endAngle = (endPercent / 100) * 2 * Math.PI + START_ANGLE_OFFSET;

        // Path Calculation
        const x1 = center + radius * Math.cos(startAngle);
        const y1 = center + radius * Math.sin(startAngle);
        const x2 = center + radius * Math.cos(endAngle);
        const y2 = center + radius * Math.sin(endAngle);

        const largeArcFlag = percent > 50 ? 1 : 0;

        const pathData = [
            `M ${center} ${center}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');

        // Label Calculation
        const middleAngle = startAngle + (endAngle - startAngle) / 2;

        // Determine label position
        // If slice is small (< 10%), push label further out
        const isSmall = percent < 12;
        const rLabel = isSmall ? labelRadius + 15 : labelRadius - 15; // Further out if small

        const textX = center + rLabel * Math.cos(middleAngle);
        const textY = center + rLabel * Math.sin(middleAngle);

        // Leader line for small slices
        let leaderLine = null;
        if (isSmall) {
            const xLineStart = center + (radius + 5) * Math.cos(middleAngle);
            const yLineStart = center + (radius + 5) * Math.sin(middleAngle);
            const xLineEnd = center + (rLabel - 10) * Math.cos(middleAngle);
            const yLineEnd = center + (rLabel - 10) * Math.sin(middleAngle);

            leaderLine = (
                <line
                    x1={xLineStart} y1={yLineStart}
                    x2={xLineEnd} y2={yLineEnd}
                    stroke="white" strokeWidth="1" opacity="0.7"
                />
            );
        }

        return {
            color,
            pathData,
            textX,
            textY,
            percent,
            leaderLine,
            id: color
        };
    }).filter(Boolean);

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
            {/* 
               Backdrop circle for better readability? 
               Maybe a subtle semi-transparent black circle behind the chart 
            */}
            <div className="bg-black/40 rounded-full p-1 backdrop-blur-sm shadow-2xl">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                    {/* Slices */}
                    {/* Slices */}
                    {slices.map(slice => {
                        if (!slice) return null;

                        // Fix for 100% slice disappearing (Arc command can't do full circle)
                        if (slice.percent >= 99.9) {
                            return (
                                <circle
                                    key={slice.id}
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill={COLORS[slice.color as Color]}
                                    className=""
                                />
                            );
                        }

                        return (
                            <path
                                key={slice.id}
                                d={slice.pathData}
                                fill={COLORS[slice.color as Color]}
                            />
                        );
                    })}

                    {/* Labels & Lines */}
                    {slices.map(slice => slice && (
                        <g key={`label-${slice.id}`}>
                            {slice.leaderLine}
                            <text
                                x={slice.textX}
                                y={slice.textY}
                                fill="white"
                                fontSize="12"
                                fontWeight="bold"
                                textAnchor="middle"
                                dominantBaseline="central"
                                style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}
                            >
                                {normalizedScores[slice.color as Color]}%
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
};
