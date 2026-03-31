import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { Account, AccountStatus } from '../models/user/Account';
import { SaveData } from '../models/user/SaveData';
import { UserCurrency } from '../models/user/UserCurrency';
import { UserStat } from '../models/user/UserStat';
import { UserItem } from '../models/user/UserItem';
import { StorageItem } from '../models/user/StorageItem';
import { FarmPlot } from '../models/user/FarmPlot';
import { ForumThread } from '../models/forum/ForumThread';
import { ForumPost } from '../models/forum/ForumPost';

type AdminAccountSummary = {
    accountId: string;
    username: string;
    email: string;
    createdAt: Date;
    status: AccountStatus;
    level: number;
    exp: number;
    potentialPoints: number;
    coin: number;
    gem: number;
    hasSaveData: boolean;
    lastSaveAt: Date | null;
};

export class AdminController {
    private static getAccountId(req: Request): string {
        const rawAccountId = req.params.accountId;
        return Array.isArray(rawAccountId) ? rawAccountId[0] : rawAccountId;
    }

    public static async getDashboard(req: Request, res: Response): Promise<void> {
        const search = String(req.query.search || '').trim().toLowerCase();

        const [accounts, stats, currencies, saves] = await Promise.all([
            ApplicationDbContext.getRepository(Account).find({
                order: { createdAt: 'DESC' }
            }),
            ApplicationDbContext.getRepository(UserStat).find(),
            ApplicationDbContext.getRepository(UserCurrency).find(),
            ApplicationDbContext.getRepository(SaveData).find()
        ]);

        const statsMap = new Map(stats.map((stat) => [stat.accountId, stat]));
        const currencyMap = new Map(currencies.map((currency) => [currency.accountId, currency]));
        const saveMap = new Map(saves.map((save) => [save.accountId, save]));

        const users = accounts
            .map<AdminAccountSummary>((account) => {
                const stat = statsMap.get(account.id);
                const currency = currencyMap.get(account.id);
                const save = saveMap.get(account.id);

                return {
                    accountId: account.id,
                    username: account.username,
                    email: account.email,
                    createdAt: account.createdAt,
                    status: account.status,
                    level: stat?.level ?? 1,
                    exp: stat?.exp ?? 0,
                    potentialPoints: stat?.potentialPoints ?? 0,
                    coin: currency?.coin ?? 0,
                    gem: currency?.gem ?? 0,
                    hasSaveData: Boolean(save?.dataSave),
                    lastSaveAt: save?.lastUpdated ?? null
                };
            })
            .filter((user) => {
                if (!search) {
                    return true;
                }

                return [
                    user.accountId,
                    user.username,
                    user.email
                ].some((value) => value.toLowerCase().includes(search));
            });

        const statusCounts = users.reduce<Record<string, number>>((acc, user) => {
            const key = String(user.status);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        res.status(200).json({
            summary: {
                totalUsers: users.length,
                bannedUsers: statusCounts[String(AccountStatus.Ban)] || 0,
                warnedUsers: statusCounts[String(AccountStatus.Warn)] || 0,
                activeUsers: statusCounts[String(AccountStatus.None)] || 0
            },
            users
        });
    }

    public static async getUserDetail(req: Request, res: Response): Promise<void> {
        const accountId = AdminController.getAccountId(req);

        const [
            account,
            stat,
            currency,
            saveData,
            inventoryCount,
            storageCount,
            farmCount,
            threadCount,
            postCount
        ] = await Promise.all([
            ApplicationDbContext.getRepository(Account).findOne({ where: { id: accountId } }),
            ApplicationDbContext.getRepository(UserStat).findOne({ where: { accountId } }),
            ApplicationDbContext.getRepository(UserCurrency).findOne({ where: { accountId } }),
            ApplicationDbContext.getRepository(SaveData).findOne({ where: { accountId } }),
            ApplicationDbContext.getRepository(UserItem).count({ where: { accountId } }),
            ApplicationDbContext.getRepository(StorageItem).count({ where: { accountId } }),
            ApplicationDbContext.getRepository(FarmPlot).count({ where: { accountId } }),
            ApplicationDbContext.getRepository(ForumThread).count({ where: { authorId: accountId } }),
            ApplicationDbContext.getRepository(ForumPost).count({ where: { authorId: accountId } })
        ]);

        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }

        let parsedSave: unknown = null;

        if (saveData?.dataSave) {
            try {
                parsedSave = JSON.parse(saveData.dataSave);
            } catch {
                parsedSave = { invalidJson: true };
            }
        }

        res.status(200).json({
            account: {
                accountId: account.id,
                username: account.username,
                email: account.email,
                createdAt: account.createdAt,
                status: account.status
            },
            stats: stat || null,
            currency: currency || null,
            saveData: {
                lastUpdated: saveData?.lastUpdated || null,
                raw: saveData?.dataSave || null,
                parsed: parsedSave
            },
            activity: {
                inventoryCount,
                storageCount,
                farmCount,
                threadCount,
                postCount
            }
        });
    }

    public static async updateStatus(req: Request, res: Response): Promise<void> {
        const accountId = AdminController.getAccountId(req);
        const status = Number(req.body.status);

        if (!Object.values(AccountStatus).includes(status)) {
            res.status(400).json({ error: 'Status invalid' });
            return;
        }

        const repo = ApplicationDbContext.getRepository(Account);
        const account = await repo.findOne({ where: { id: accountId } });

        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }

        account.status = status;
        await repo.save(account);

        res.status(200).json({
            message: 'Status updated',
            accountId,
            status: account.status
        });
    }

    public static async updateCurrency(req: Request, res: Response): Promise<void> {
        const accountId = AdminController.getAccountId(req);
        const coin = Number(req.body.coin);
        const gem = Number(req.body.gem);

        if (!Number.isFinite(coin) || coin < 0 || !Number.isFinite(gem) || gem < 0) {
            res.status(400).json({ error: 'Coin/gem must be non-negative numbers' });
            return;
        }

        const account = await ApplicationDbContext.getRepository(Account).findOne({ where: { id: accountId } });
        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }

        const repo = ApplicationDbContext.getRepository(UserCurrency);
        let wallet = await repo.findOne({ where: { accountId } });

        if (!wallet) {
            wallet = new UserCurrency();
            wallet.accountId = accountId;
        }

        wallet.coin = coin;
        wallet.gem = gem;
        wallet.updatedAt = new Date();

        await repo.save(wallet);

        res.status(200).json({
            message: 'Currency updated',
            accountId,
            coin: wallet.coin,
            gem: wallet.gem
        });
    }
}
