import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { GiftCode } from '../models/giftcode/GiftCode';
import { GiftCodeRedemption } from '../models/giftcode/GiftCodeRedemption';
import { GiftCodeService } from '../services/GiftCodeService';

export class GiftCodeController {
    public static async getLiveGiftCodes(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;

        try {
            const [giftCodes, redemptions] = await Promise.all([
                ApplicationDbContext.getRepository(GiftCode).find({
                    relations: ['rewards'],
                    order: { createdAt: 'DESC' }
                }),
                ApplicationDbContext.getRepository(GiftCodeRedemption).find({
                    where: { accountId }
                })
            ]);

            const redeemedIds = new Set(redemptions.map(redemption => redemption.giftCodeId));

            const result = giftCodes
                .filter(giftCode => GiftCodeService.isRedeemable(giftCode))
                .map(giftCode => ({
                    id: giftCode.id,
                    code: giftCode.code,
                    title: giftCode.title || giftCode.code,
                    description: giftCode.description || null,
                    expiresAt: giftCode.expiresAt || null,
                    isUnlimitedDuration: giftCode.isUnlimitedDuration,
                    isUnlimitedQuantity: giftCode.isUnlimitedQuantity,
                    maxRedemptions: giftCode.maxRedemptions || null,
                    redeemedCount: giftCode.redeemedCount,
                    remainingCount: GiftCodeService.getRemainingCount(giftCode),
                    forumThreadId: giftCode.forumThreadId || null,
                    hasRedeemed: redeemedIds.has(giftCode.id),
                    rewards: giftCode.rewards.map(reward => GiftCodeService.serializeReward(reward))
                }));

            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to load giftcodes.' });
        }
    }

    public static async redeem(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const code = String(req.body.code || '');

        try {
            const result = await GiftCodeService.redeemGiftCode(code, accountId);
            res.status(200).json({
                message: 'Giftcode redeemed successfully.',
                ...result
            });
        } catch (error: any) {
            console.error('Giftcode redeem failed:', {
                accountId,
                code,
                message: error?.message
            });
            res.status(400).json({ error: error.message || 'Giftcode redemption failed.' });
        }
    }
}
