import { GameStatsViewModel } from '../models/GameStatsViewModel';

export class GameLogicValidator {
    public static getExpToNextLevel(level: number): number {
        if (level < 100) {
            return Math.floor(100 + level * 50 + Math.pow(level, 2.2));
        } else if (level >= 100 && level < 200) {
            return Math.floor(100 + level * 80 + Math.pow(level, 2.5));
        } else {
            return Math.floor(100 + level * 100 + Math.pow(level, 3));
        }
    }

    public static isStatPointsValid(stats: GameStatsViewModel): boolean {
        const basePoints = 5;
        const pointsPerLevel = 5;

        const currentTotalPoints = stats.str + stats.dex + stats.con + stats.intStat + stats.potentialPoints;
        const expectedTotalPoints = basePoints + (stats.lvl - 1) * pointsPerLevel;

        return currentTotalPoints <= expectedTotalPoints + 2;
    }

    public static isHealthValid(stats: GameStatsViewModel): boolean {
        const baseMaxHP = 100 + (stats.con * 10);
        const maxPossibleHP = baseMaxHP * 5 + 5000;

        if (stats.currentKnightHP > maxPossibleHP || stats.currentmageHP > maxPossibleHP) {
            return false;
        }
        return true;
    }

    public static isStaminaValid(stats: GameStatsViewModel): boolean {
        return stats.currentStamina <= 500;
    }
}