import { EntityManager, IsNull, LessThan } from 'typeorm';
import { ApplicationDbContext } from '../config/database';
import { GiftCode } from '../models/giftcode/GiftCode';
import { GiftCodeRedemption } from '../models/giftcode/GiftCodeRedemption';
import { GiftCodeReward } from '../models/giftcode/GiftCodeReward';
import { ForumThread } from '../models/forum/ForumThread';
import { Account } from '../models/user/Account';
import { UserItem } from '../models/user/UserItem';
import { getItemCategoryLabel, isEquipmentItem, isStackableItem } from '../utils/item-catalog';

type GiftCodeInputReward = {
    itemId: number;
    quantity: number;
    rarity?: number;
    qualityFactor?: number;
};

type CreateGiftCodeInput = {
    code: string;
    title?: string;
    description?: string;
    isUnlimitedQuantity: boolean;
    maxRedemptions?: number | null;
    isUnlimitedDuration: boolean;
    expiresAt?: Date | null;
    publishToForum: boolean;
    rewards: GiftCodeInputReward[];
};

export class GiftCodeService {
    private static readonly INVENTORY_CAPACITY = 40;

    public static normalizeCode(rawCode: string): string {
        return rawCode.trim().toUpperCase();
    }

    public static sanitizeRewards(rewards: GiftCodeInputReward[]): GiftCodeInputReward[] {
        return rewards
            .filter(reward => Number.isFinite(reward.itemId) && Number.isFinite(reward.quantity))
            .map(reward => ({
                itemId: Math.trunc(reward.itemId),
                quantity: isEquipmentItem(reward.itemId)
                    ? 1
                    : Math.max(1, Math.trunc(reward.quantity)),
                rarity: Number.isFinite(reward.rarity) ? Math.max(1, Math.trunc(reward.rarity!)) : 1,
                qualityFactor: Number.isFinite(reward.qualityFactor)
                    ? Math.max(0.1, Number(reward.qualityFactor))
                    : 1
            }));
    }

    public static async createGiftCode(
        input: CreateGiftCodeInput,
        createdByAccountId?: string | null
    ): Promise<GiftCode> {
        const normalizedCode = GiftCodeService.normalizeCode(input.code);
        const sanitizedRewards = GiftCodeService.sanitizeRewards(input.rewards);

        if (!normalizedCode) {
            throw new Error('Giftcode is required.');
        }

        if (sanitizedRewards.length === 0) {
            throw new Error('At least one reward is required.');
        }

        if (!input.isUnlimitedQuantity && (!input.maxRedemptions || input.maxRedemptions <= 0)) {
            throw new Error('Limited giftcodes require a positive quantity.');
        }

        if (!input.isUnlimitedDuration && !input.expiresAt) {
            throw new Error('Expiring giftcodes require an expiry date.');
        }

        return ApplicationDbContext.manager.transaction(async manager => {
            const existingCode = await manager.findOne(GiftCode, {
                where: { code: normalizedCode }
            });

            if (existingCode) {
                throw new Error('Giftcode already exists.');
            }

            const giftCode = new GiftCode();
            giftCode.code = normalizedCode;
            giftCode.title = input.title?.trim() || null;
            giftCode.description = input.description?.trim() || null;
            giftCode.isUnlimitedQuantity = input.isUnlimitedQuantity;
            giftCode.maxRedemptions = input.isUnlimitedQuantity
                ? null
                : Math.max(1, Math.trunc(input.maxRedemptions || 0));
            giftCode.isUnlimitedDuration = input.isUnlimitedDuration;
            giftCode.expiresAt = input.isUnlimitedDuration ? null : input.expiresAt || null;
            giftCode.publishToForum = input.publishToForum;
            giftCode.createdByAccountId = createdByAccountId || null;
            giftCode.redeemedCount = 0;
            giftCode.isActive = true;
            giftCode.rewards = sanitizedRewards.map(reward => {
                const entity = new GiftCodeReward();
                entity.itemId = reward.itemId;
                entity.quantity = reward.quantity;
                entity.rarity = reward.rarity ?? 1;
                entity.qualityFactor = reward.qualityFactor ?? 1;
                return entity;
            });

            const savedGiftCode = await manager.save(giftCode);

            if (savedGiftCode.publishToForum) {
                const thread = await GiftCodeService.createForumAnnouncement(manager, savedGiftCode);
                savedGiftCode.forumThreadId = thread.id;
                await manager.save(savedGiftCode);
            }

            return await manager.findOneOrFail(GiftCode, {
                where: { id: savedGiftCode.id },
                relations: ['rewards']
            });
        });
    }

    public static async redeemGiftCode(code: string, accountId: string) {
        const normalizedCode = GiftCodeService.normalizeCode(code);

        if (!normalizedCode) {
            throw new Error('Giftcode is required.');
        }

        return ApplicationDbContext.manager.transaction(async manager => {
            const giftCode = await manager.findOne(GiftCode, {
                where: { code: normalizedCode },
                relations: ['rewards']
            });

            if (!giftCode || !giftCode.isActive) {
                throw new Error('Giftcode not found or inactive.');
            }

            if (!giftCode.isUnlimitedDuration && giftCode.expiresAt && giftCode.expiresAt.getTime() < Date.now()) {
                throw new Error('Giftcode has expired.');
            }

            if (!giftCode.isUnlimitedQuantity && giftCode.maxRedemptions !== null && giftCode.redeemedCount >= (giftCode.maxRedemptions || 0)) {
                throw new Error('Giftcode redemption limit reached.');
            }

            const existingRedemption = await manager.findOne(GiftCodeRedemption, {
                where: { giftCodeId: giftCode.id, accountId }
            });

            if (existingRedemption) {
                throw new Error('You have already redeemed this giftcode.');
            }

            const occupiedSlots = await GiftCodeService.getOccupiedSlots(manager, accountId);

            for (const reward of giftCode.rewards) {
                await GiftCodeService.applyReward(manager, accountId, reward, occupiedSlots);
            }

            await manager.insert(GiftCodeRedemption, {
                giftCodeId: giftCode.id,
                accountId
            });

            giftCode.redeemedCount += 1;
            await manager.update(GiftCode, { id: giftCode.id }, {
                redeemedCount: giftCode.redeemedCount
            });

            return {
                giftCodeId: giftCode.id,
                code: giftCode.code,
                title: giftCode.title || giftCode.code,
                redeemedCount: giftCode.redeemedCount,
                remainingCount: GiftCodeService.getRemainingCount(giftCode),
                rewards: giftCode.rewards.map(reward => GiftCodeService.serializeReward(reward))
            };
        });
    }

    public static serializeReward(reward: Pick<GiftCodeReward, 'itemId' | 'quantity'>) {
        return {
            itemId: reward.itemId,
            quantity: isEquipmentItem(reward.itemId) ? 1 : reward.quantity,
            category: getItemCategoryLabel(reward.itemId)
        };
    }

    public static isRedeemable(giftCode: GiftCode) {
        if (!giftCode.isActive) return false;
        if (!giftCode.isUnlimitedDuration && giftCode.expiresAt && giftCode.expiresAt.getTime() < Date.now()) {
            return false;
        }
        if (!giftCode.isUnlimitedQuantity && giftCode.maxRedemptions !== null && giftCode.redeemedCount >= (giftCode.maxRedemptions || 0)) {
            return false;
        }
        return true;
    }

    public static getRemainingCount(giftCode: Pick<GiftCode, 'isUnlimitedQuantity' | 'maxRedemptions' | 'redeemedCount'>) {
        if (giftCode.isUnlimitedQuantity || giftCode.maxRedemptions === null || giftCode.maxRedemptions === undefined) {
            return null;
        }

        return Math.max(0, giftCode.maxRedemptions - giftCode.redeemedCount);
    }

    public static formatAnnouncementContent(giftCode: GiftCode): string {
        const rewardsBlock = giftCode.rewards
            .map(reward => {
                const quantity = isEquipmentItem(reward.itemId) ? 1 : reward.quantity;
                return `- Item ${reward.itemId} (${getItemCategoryLabel(reward.itemId)}): x${quantity}`;
            })
            .join('\n');

        const lines = [
            `Giftcode: ${giftCode.code}`,
            giftCode.description ? `Mo ta: ${giftCode.description}` : null,
            '',
            'Phan thuong:',
            rewardsBlock,
            '',
            giftCode.isUnlimitedDuration
                ? 'Thoi han: Khong gioi han'
                : `Het han: ${giftCode.expiresAt?.toISOString() || 'N/A'}`,
            giftCode.isUnlimitedQuantity
                ? 'So luot: Khong gioi han'
                : `So luot: ${giftCode.maxRedemptions || 0}`
        ].filter(Boolean);

        return lines.join('\n');
    }

    private static async createForumAnnouncement(manager: EntityManager, giftCode: GiftCode) {
        const authorId = await GiftCodeService.resolveAnnouncementAuthorId(manager);

        const thread = new ForumThread();
        thread.authorId = authorId;
        thread.title = `[GiftCode] ${giftCode.title || giftCode.code}`;
        thread.content = GiftCodeService.formatAnnouncementContent(giftCode);
        thread.createdAt = new Date();
        thread.viewCount = 0;

        return await manager.save(thread);
    }

    private static async resolveAnnouncementAuthorId(manager: EntityManager) {
        const byUsername = await manager.findOne(Account, { where: { username: 'admin' } });
        if (byUsername) {
            return byUsername.id;
        }

        const anyAccount = await manager.findOne(Account, { order: { createdAt: 'ASC' } });
        if (anyAccount) {
            return anyAccount.id;
        }

        throw new Error('No account available to publish giftcode announcement on forum.');
    }

    private static async getOccupiedSlots(manager: EntityManager, accountId: string) {
        const inventoryItems = await manager.find(UserItem, {
            where: { accountId, chestId: IsNull(), slotIndex: LessThan(GiftCodeService.INVENTORY_CAPACITY) }
        });

        return new Set(inventoryItems.map(item => item.slotIndex));
    }

    private static async applyReward(
        manager: EntityManager,
        accountId: string,
        reward: GiftCodeReward,
        occupiedSlots: Set<number>
    ) {
        const quantity = isEquipmentItem(reward.itemId) ? 1 : Math.max(1, reward.quantity);

        if (isStackableItem(reward.itemId)) {
            const stackItem = await manager.findOne(UserItem, {
                where: { accountId, chestId: IsNull(), itemId: reward.itemId }
            });

            if (stackItem) {
                stackItem.quantity += quantity;
                await manager.save(stackItem);
                return;
            }
        }

        for (let index = 0; index < quantity; index++) {
            const item = new UserItem();
            item.accountId = accountId;
            item.itemId = reward.itemId;
            item.quantity = isStackableItem(reward.itemId) ? quantity : 1;
            item.slotIndex = GiftCodeService.findNextFreeSlot(occupiedSlots);
            item.isEquipped = false;
            item.rarity = reward.rarity;
            item.qualityFactor = reward.qualityFactor;
            item.createdAt = new Date();

            await manager.save(item);

            if (isStackableItem(reward.itemId)) {
                break;
            }
        }
    }

    private static findNextFreeSlot(occupiedSlots: Set<number>) {
        for (let slot = 0; slot < GiftCodeService.INVENTORY_CAPACITY; slot++) {
            if (!occupiedSlots.has(slot)) {
                occupiedSlots.add(slot);
                return slot;
            }
        }

        throw new Error('Inventory is full.');
    }
}
