import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { Account, AccountStatus } from '../models/user/Account';
import { UserStat } from '../models/user/UserStat';
import { UserCurrency } from '../models/user/UserCurrency';

export class LeaderboardController {
    // Để tối ưu, nên lưu cache kết quả này lại trong khoảng 5 phút giống C#
    public static async getLeaderboard(req: Request, res: Response): Promise<void> {
        try {
            const accounts = await ApplicationDbContext.getRepository(Account).find({ where: { status: AccountStatus.None } });
            const stats = await ApplicationDbContext.getRepository(UserStat).find();
            const currencies = await ApplicationDbContext.getRepository(UserCurrency).find();

            const statsDict = new Map(stats.map(s => [s.accountId, s]));
            const currDict = new Map(currencies.map(c => [c.accountId, c]));

            const leaderboardList = [];

            for (const acc of accounts) {
                if (!acc.id) continue;
                
                const userStat = statsDict.get(acc.id);
                if (!userStat || userStat.level <= 0) continue;

                const userCurrency = currDict.get(acc.id);

                leaderboardList.push({
                    username: acc.username,
                    level: userStat.level,
                    exp: userStat.exp,
                    coin: userCurrency?.coin ?? 0
                });
            }

            const result = leaderboardList
                .sort((a, b) => {
                    if (b.level !== a.level) return b.level - a.level;
                    return b.exp - a.exp;
                })
                .slice(0, 20)
                .map((player, index) => ({ ...player, rank: index + 1 }));

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: "Lỗi lấy dữ liệu bảng xếp hạng" });
        }
    }
}