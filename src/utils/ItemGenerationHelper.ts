export class SeededRandom {
    private state: number;

    constructor(seed: number) {
        this.state = seed >>> 0;
    }

    public nextFloat(): number {
        this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
        return this.state / 4294967296.0;
    }
}

export class ItemGenerationHelper {
    public static getRandomRarity(rng: SeededRandom): number {
        const roll = rng.nextFloat() * 100.0;
        if (roll < 40.0) return 0; // Rusty
        if (roll < 70.0) return 1; // Common
        if (roll < 85.0) return 2; // Refined
        if (roll < 93.0) return 3; // Rare
        if (roll < 97.0) return 4; // Relic
        if (roll < 99.0) return 5; // Glacial
        if (roll < 99.7) return 6; // Legendary
        if (roll < 99.95) return 7; // Celestial
        return 8; // Mythic
    }

    public static getWeightedQualityFactor(rng: SeededRandom): number {
        const raw = Math.pow(rng.nextFloat(), 4);
        return 0.5 + (1.0 - 0.5) * raw;
    }
}