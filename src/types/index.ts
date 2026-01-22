export type Color = 'red' | 'green' | 'blue' | 'yellow';




export interface BaseScore {
    red: number;
    green: number;
    blue: number;
    yellow: number;
}

export interface Base {
    id: string;
    // We keep owner for high-level logic, but it's determined by who has 100% (or majority? User said 100% to capture).
    // Let's say Owner is who reached 100% last? Or whoever has > 0?
    // Actually, "Capture" = 100%. So Owner is only set when someone hits 100%.
    owner: Color | 'neutral';
    heldBy: Color | null;
    lastInteraction: number; // Timestamp for interpolation
    scores: BaseScore;
}

export interface GameState {
    status: 'IDLE' | 'PLAYING' | 'ENDED' | 'PAUSED';
    endTime: number;
    remainingTime?: number; // Snapshot of remaining time when paused
    bases: Record<string, Base>;
}

export const INITIAL_BASES: Record<string, Base> = {
    'base_1': {
        id: 'base_1',
        owner: 'neutral',
        heldBy: null,
        lastInteraction: 0,
        scores: { red: 25, green: 25, blue: 25, yellow: 25 }
    },
    'base_2': {
        id: 'base_2',
        owner: 'neutral',
        heldBy: null,
        lastInteraction: 0,
        scores: { red: 25, green: 25, blue: 25, yellow: 25 }
    },
    'base_3': {
        id: 'base_3',
        owner: 'neutral',
        heldBy: null,
        lastInteraction: 0,
        scores: { red: 25, green: 25, blue: 25, yellow: 25 }
    },
    'base_4': {
        id: 'base_4',
        owner: 'neutral',
        heldBy: null,
        lastInteraction: 0,
        scores: { red: 25, green: 25, blue: 25, yellow: 25 }
    },
};
