import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { UserStat } from '../models/user/UserStat';
import { SaveData } from '../models/user/SaveData';
import { UserCurrency } from '../models/user/UserCurrency';
import { GameLogicValidator } from '../services/GameLogicValidator';

export class PlayerStatsController {
    private static async getOrCreateStats(accountId: string): Promise<UserStat> {
        const repo = ApplicationDbContext.getRepository(UserStat);
        let stats = await repo.findOne({ where: { accountId } });

        if (!stats) {
            stats = new UserStat();
            stats.accountId = accountId;
            stats.level = 1;

            const oldSave = await ApplicationDbContext.getRepository(SaveData).findOne({ where: { accountId } });
            if (oldSave && oldSave.dataSave) {
                try {
                    const oldData = JSON.parse(oldSave.dataSave);
                    stats.level = oldData.lvl > 0 ? oldData.lvl : 1;
                    stats.exp = oldData.exp || 0;
                    stats.potentialPoints = oldData.potentialPoints || 5;
                    stats.str = oldData.str || 0;
                    stats.dex = oldData.dex || 0;
                    stats.int = oldData.intStat || 0;
                    stats.con = oldData.con || 0;
                } catch { }
            }
            await repo.save(stats);
        }
        return stats;
    }

    public static async getProfile(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const stats = await PlayerStatsController.getOrCreateStats(accountId);

        res.status(200).json({
            level: stats.level,
            exp: stats.exp,
            potentialPoints: stats.potentialPoints,
            str: stats.str,
            dex: stats.dex,
            con: stats.con,
            intStat: stats.int
        });
    }

    public static async distributePoint(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const { statType, amount = 1 } = req.body;
        const stats = await PlayerStatsController.getOrCreateStats(accountId);

        if (stats.potentialPoints < amount) {
            res.status(400).json("Không đủ điểm tiềm năng.");
            return;
        }

        let success = false;
        switch (statType.toUpperCase()) {
            case "STR": stats.str += amount; success = true; break;
            case "DEX": stats.dex += amount; success = true; break;
            case "INT": stats.int += amount; success = true; break;
            case "CON": stats.con += amount; success = true; break;
        }

        if (success) {
            stats.potentialPoints -= amount;
            stats.updatedAt = new Date();
            await ApplicationDbContext.getRepository(UserStat).save(stats);

            res.status(200).json({
                level: stats.level,
                exp: stats.exp,
                potentialPoints: stats.potentialPoints,
                str: stats.str,
                dex: stats.dex,
                con: stats.con,
                intStat: stats.int
            });
            return;
        }
        res.status(400).json("Loại chỉ số không hợp lệ.");
    }

    public static async resetStats(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;

        try {
            await ApplicationDbContext.manager.transaction(async (manager) => {
                const stats = await PlayerStatsController.getOrCreateStats(accountId);
                const wallet = await manager.findOne(UserCurrency, { where: { accountId } });

                if (!wallet || wallet.gem < 20) {
                    res.status(200).json({ success: false, message: "Không đủ Gem (Cần 20)." });
                    return;
                }

                wallet.gem -= 20;
                wallet.updatedAt = new Date();

                stats.str = 0; stats.dex = 0; stats.int = 0; stats.con = 0;
                stats.potentialPoints = 5 + (stats.level - 1) * 5;
                stats.updatedAt = new Date();

                await manager.save(wallet);
                await manager.save(stats);

                res.status(200).json({
                    success: true,
                    message: "Reset thành công.",
                    newStats: {
                        level: stats.level,
                        exp: stats.exp,
                        potentialPoints: stats.potentialPoints,
                        str: stats.str,
                        dex: stats.dex,
                        con: stats.con,
                        intStat: stats.int
                    },
                    coin: wallet.coin,
                    gem: wallet.gem
                });
            });
        } catch {
            res.status(400).json("Lỗi server.");
        }
    }

    public static async addExperience(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const { amount } = req.body;

        try {
            const stats = await PlayerStatsController.getOrCreateStats(accountId);
            stats.exp += amount;
            if (stats.exp < 0) stats.exp = 0;

            let leveledUp = false;
            while (true) {
                const expToNext = GameLogicValidator.getExpToNextLevel(stats.level);
                if (stats.exp >= expToNext) {
                    stats.exp -= expToNext;
                    stats.level++;
                    stats.potentialPoints += 5;
                    leveledUp = true;
                } else break;
            }

            stats.updatedAt = new Date();
            await ApplicationDbContext.getRepository(UserStat).save(stats);

            res.status(200).json({
                success: true,
                leveledUp: leveledUp,
                newStats: {
                    level: stats.level,
                    exp: stats.exp,
                    potentialPoints: stats.potentialPoints,
                    str: stats.str,
                    dex: stats.dex,
                    con: stats.con,
                    intStat: stats.int
                }
            });
        } catch (ex: any) {
            res.status(400).json("Lỗi xử lý EXP: " + ex.message);
        }
    }
}