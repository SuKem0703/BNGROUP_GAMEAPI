import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { ForumPost } from '../models/forum/ForumPost';
import { ForumThread } from '../models/forum/ForumThread';
import { GiftCode } from '../models/giftcode/GiftCode';
import { GiftCodeRedemption } from '../models/giftcode/GiftCodeRedemption';
import { Account, AccountStatus } from '../models/user/Account';
import { FarmPlot } from '../models/user/FarmPlot';
import { Role, RoleType } from '../models/user/Role';
import { SaveData } from '../models/user/SaveData';
import { StorageItem } from '../models/user/StorageItem';
import { UserCurrency } from '../models/user/UserCurrency';
import { UserItem } from '../models/user/UserItem';
import { UserStat } from '../models/user/UserStat';
import { GiftCodeService } from '../services/GiftCodeService';

type AdminAccountSummary = {
    accountId: string;
    username: string;
    email: string;
    createdAt: Date;
    status: AccountStatus;
    role: string;
    level: number;
    exp: number;
    potentialPoints: number;
    coin: number;
    gem: number;
    hasSaveData: boolean;
    lastSaveAt: Date | null;
};

export class AdminController {
    private static getParam(req: Request, key: string): string {
        const value = req.params[key];
        return Array.isArray(value) ? value[0] : value;
    }

    private static getAccountId(req: Request): string {
        return AdminController.getParam(req, 'accountId');
    }

    private static getThreadId(req: Request): number {
        return Number(AdminController.getParam(req, 'threadId'));
    }

    private static getPostId(req: Request): number {
        return Number(AdminController.getParam(req, 'postId'));
    }

    private static getGiftCodeId(req: Request): number {
        return Number(AdminController.getParam(req, 'giftCodeId'));
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

        const statsMap = new Map(stats.map(stat => [stat.accountId, stat]));
        const currencyMap = new Map(currencies.map(currency => [currency.accountId, currency]));
        const saveMap = new Map(saves.map(save => [save.accountId, save]));

        const users = accounts
            .map<AdminAccountSummary>(account => {
                const stat = statsMap.get(account.id);
                const currency = currencyMap.get(account.id);
                const save = saveMap.get(account.id);

                return {
                    accountId: account.id,
                    username: account.username,
                    email: account.email,
                    createdAt: account.createdAt,
                    status: account.status,
                    role: account.role?.name || RoleType.Player,
                    level: stat?.level ?? 1,
                    exp: stat?.exp ?? 0,
                    potentialPoints: stat?.potentialPoints ?? 0,
                    coin: currency?.coin ?? 0,
                    gem: currency?.gem ?? 0,
                    hasSaveData: Boolean(save?.dataSave),
                    lastSaveAt: save?.lastUpdated ?? null
                };
            })
            .filter(user => {
                if (!search) {
                    return true;
                }

                return [
                    user.accountId,
                    user.username,
                    user.email,
                    user.role
                ].some(value => value.toLowerCase().includes(search));
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
            postCount,
            giftCodeRedemptionCount
        ] = await Promise.all([
            ApplicationDbContext.getRepository(Account).findOne({ where: { id: accountId } }),
            ApplicationDbContext.getRepository(UserStat).findOne({ where: { accountId } }),
            ApplicationDbContext.getRepository(UserCurrency).findOne({ where: { accountId } }),
            ApplicationDbContext.getRepository(SaveData).findOne({ where: { accountId } }),
            ApplicationDbContext.getRepository(UserItem).count({ where: { accountId } }),
            ApplicationDbContext.getRepository(StorageItem).count({ where: { accountId } }),
            ApplicationDbContext.getRepository(FarmPlot).count({ where: { accountId } }),
            ApplicationDbContext.getRepository(ForumThread).count({ where: { authorId: accountId } }),
            ApplicationDbContext.getRepository(ForumPost).count({ where: { authorId: accountId } }),
            ApplicationDbContext.getRepository(GiftCodeRedemption).count({ where: { accountId } })
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
                status: account.status,
                role: account.role?.name || RoleType.Player
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
                postCount,
                giftCodeRedemptionCount
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

    public static async updateRole(req: Request, res: Response): Promise<void> {
        const accountId = AdminController.getAccountId(req);
        const roleName = String(req.body.role || '').trim() as RoleType;

        if (!Object.values(RoleType).includes(roleName)) {
            res.status(400).json({ error: 'Role invalid' });
            return;
        }

        const [account, role] = await Promise.all([
            ApplicationDbContext.getRepository(Account).findOne({ where: { id: accountId } }),
            ApplicationDbContext.getRepository(Role).findOne({ where: { name: roleName } })
        ]);

        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }

        if (!role) {
            res.status(404).json({ error: 'Role not found in database' });
            return;
        }

        account.role = role;
        account.roleId = role.id;
        await ApplicationDbContext.getRepository(Account).save(account);

        res.status(200).json({
            message: 'Role updated',
            accountId,
            role: role.name
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

    public static async getForumDashboard(req: Request, res: Response): Promise<void> {
        const search = String(req.query.search || '').trim().toLowerCase();
        const threads = await ApplicationDbContext.getRepository(ForumThread).find({
            relations: ['author', 'posts'],
            order: { createdAt: 'DESC' }
        });

        const filteredThreads = threads
            .map(thread => ({
                id: thread.id,
                title: thread.title,
                content: thread.content,
                preview: thread.content.slice(0, 140),
                authorName: thread.author?.username || 'Unknown',
                authorId: thread.authorId,
                createdAt: thread.createdAt,
                viewCount: thread.viewCount,
                postCount: thread.posts.length
            }))
            .filter(thread => {
                if (!search) {
                    return true;
                }

                return [
                    thread.title,
                    thread.content,
                    thread.authorName,
                    thread.authorId
                ].some(value => value.toLowerCase().includes(search));
            });

        res.status(200).json({
            summary: {
                totalThreads: filteredThreads.length,
                totalReplies: filteredThreads.reduce((total, thread) => total + thread.postCount, 0)
            },
            threads: filteredThreads
        });
    }

    public static async getForumThreadDetail(req: Request, res: Response): Promise<void> {
        const threadId = AdminController.getThreadId(req);

        if (!Number.isFinite(threadId)) {
            res.status(400).json({ error: 'Thread id invalid' });
            return;
        }

        const thread = await ApplicationDbContext.getRepository(ForumThread).findOne({
            where: { id: threadId },
            relations: ['author', 'posts', 'posts.author'],
            order: { posts: { createdAt: 'ASC' } }
        });

        if (!thread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }

        res.status(200).json({
            id: thread.id,
            title: thread.title,
            content: thread.content,
            createdAt: thread.createdAt,
            viewCount: thread.viewCount,
            authorName: thread.author?.username || 'Unknown',
            authorId: thread.authorId,
            posts: thread.posts.map(post => ({
                id: post.id,
                content: post.content,
                createdAt: post.createdAt,
                authorName: post.author?.username || 'Unknown',
                authorId: post.authorId
            }))
        });
    }

    public static async deleteForumThread(req: Request, res: Response): Promise<void> {
        const threadId = AdminController.getThreadId(req);
        const repo = ApplicationDbContext.getRepository(ForumThread);
        const thread = await repo.findOne({ where: { id: threadId } });

        if (!thread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }

        await repo.remove(thread);
        res.status(200).json({ message: 'Thread deleted', threadId });
    }

    public static async deleteForumPost(req: Request, res: Response): Promise<void> {
        const postId = AdminController.getPostId(req);
        const repo = ApplicationDbContext.getRepository(ForumPost);
        const post = await repo.findOne({ where: { id: postId } });

        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        await repo.remove(post);
        res.status(200).json({ message: 'Post deleted', postId });
    }

    public static async getGiftCodes(req: Request, res: Response): Promise<void> {
        const search = String(req.query.search || '').trim().toLowerCase();

        const giftCodes = await ApplicationDbContext.getRepository(GiftCode).find({
            relations: ['rewards', 'redemptions'],
            order: { createdAt: 'DESC' }
        });

        const list = giftCodes
            .map(giftCode => ({
                id: giftCode.id,
                code: giftCode.code,
                title: giftCode.title || giftCode.code,
                description: giftCode.description || null,
                isActive: giftCode.isActive,
                createdAt: giftCode.createdAt,
                expiresAt: giftCode.expiresAt || null,
                isUnlimitedDuration: giftCode.isUnlimitedDuration,
                isUnlimitedQuantity: giftCode.isUnlimitedQuantity,
                maxRedemptions: giftCode.maxRedemptions || null,
                redeemedCount: giftCode.redeemedCount,
                remainingCount: GiftCodeService.getRemainingCount(giftCode),
                publishToForum: giftCode.publishToForum,
                forumThreadId: giftCode.forumThreadId || null,
                rewards: giftCode.rewards.map(reward => GiftCodeService.serializeReward(reward)),
                latestRedemptions: giftCode.redemptions
                    .slice(-5)
                    .reverse()
                    .map(redemption => ({
                        accountId: redemption.accountId,
                        redeemedAt: redemption.redeemedAt
                    }))
            }))
            .filter(giftCode => {
                if (!search) {
                    return true;
                }

                return [
                    giftCode.code,
                    giftCode.title,
                    giftCode.description || ''
                ].some(value => value.toLowerCase().includes(search));
            });

        res.status(200).json({
            summary: {
                totalGiftCodes: list.length,
                activeGiftCodes: list.filter(giftCode => giftCode.isActive).length
            },
            giftCodes: list
        });
    }

    public static async createGiftCode(req: Request, res: Response): Promise<void> {
        try {
            const giftCode = await GiftCodeService.createGiftCode({
                code: String(req.body.code || ''),
                title: String(req.body.title || ''),
                description: String(req.body.description || ''),
                isUnlimitedQuantity: Boolean(req.body.isUnlimitedQuantity),
                maxRedemptions: req.body.maxRedemptions === null || req.body.maxRedemptions === undefined
                    ? null
                    : Number(req.body.maxRedemptions),
                isUnlimitedDuration: Boolean(req.body.isUnlimitedDuration),
                expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
                publishToForum: Boolean(req.body.publishToForum),
                rewards: Array.isArray(req.body.rewards) ? req.body.rewards : []
            });

            res.status(201).json({
                message: 'Giftcode created successfully.',
                giftCode: {
                    id: giftCode.id,
                    code: giftCode.code,
                    title: giftCode.title || giftCode.code,
                    forumThreadId: giftCode.forumThreadId || null
                }
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Giftcode creation failed.' });
        }
    }

    public static async updateGiftCodeState(req: Request, res: Response): Promise<void> {
        const giftCodeId = AdminController.getGiftCodeId(req);
        const isActive = Boolean(req.body.isActive);

        const repo = ApplicationDbContext.getRepository(GiftCode);
        const giftCode = await repo.findOne({ where: { id: giftCodeId } });

        if (!giftCode) {
            res.status(404).json({ error: 'Giftcode not found' });
            return;
        }

        giftCode.isActive = isActive;
        await repo.save(giftCode);

        res.status(200).json({
            message: 'Giftcode state updated',
            giftCodeId,
            isActive: giftCode.isActive
        });
    }

    public static async deleteGiftCode(req: Request, res: Response): Promise<void> {
        const giftCodeId = AdminController.getGiftCodeId(req);
        const repo = ApplicationDbContext.getRepository(GiftCode);
        const giftCode = await repo.findOne({ where: { id: giftCodeId } });

        if (!giftCode) {
            res.status(404).json({ error: 'Giftcode not found' });
            return;
        }

        await repo.remove(giftCode);
        res.status(200).json({ message: 'Giftcode deleted', giftCodeId });
    }
}
