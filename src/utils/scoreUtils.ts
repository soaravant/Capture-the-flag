import type { Color } from '../types';

export const getNormalizedScores = (scores: Record<Color, number>): Record<Color, number> => {
    const colors: Color[] = ['red', 'green', 'blue', 'yellow'];

    // 1. Get integer parts and remainders
    const parts = colors.map(color => {
        const value = scores[color];
        return {
            color,
            floor: Math.floor(value),
            remainder: value - Math.floor(value)
        };
    });

    // 2. Sum of floors
    const currentSum = parts.reduce((sum, part) => sum + part.floor, 0);
    const target = 100;
    let deficit = target - currentSum;

    // 3. Distribute deficit to those with largest remainders
    // Sort by remainder descending
    parts.sort((a, b) => b.remainder - a.remainder);

    const result: Record<string, number> = {};

    // Fill base result
    parts.forEach(part => {
        result[part.color] = part.floor;
    });

    // Valid colors set for strictly typing if needed (though strings work in Record)

    // Distribute 1 point to top 'deficit' candidates
    for (let i = 0; i < deficit; i++) {
        const color = parts[i].color;
        result[color] = (result[color] || 0) + 1;
    }

    // Return as Record<Color, number>
    return result as Record<Color, number>;
};
