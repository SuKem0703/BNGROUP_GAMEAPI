import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { UserCurrency } from '../models/user/UserCurrency';
import { UserItem } from '../models/user/UserItem';
import { ShopLog } from '../models/user/ShopLog';
import { In, IsNull, LessThan } from 'typeorm';

export class ShopController {
    public static async buyItem(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const { itemId, quantity, price, currency, isStackable } = req.body;

        if (price < 0) { res.status(400).json("Price cannot be negative"); return; }
        if (quantity <= 0) { res.status(400).json("Quantity must be positive"); return; }
        if (quantity > 999) { res.status(400).json("Cannot buy more than 999 items at once"); return; }

        try {
            await ApplicationDbContext.manager.transaction(async (manager) => {
                const userCurrency = await manager.findOne(UserCurrency, { where: { accountId } });
                if (!userCurrency) { throw new Error("Player wallet not found"); }

                if (currency.toLowerCase() === "coin") {
                    if (userCurrency.coin < price) throw new Error(`Not enough ${currency}`);
                    userCurrency.coin -= price;
                } else if (currency.toLowerCase() === "gem") {
                    if (userCurrency.gem < price) throw new Error(`Not enough ${currency}`);
                    userCurrency.gem -= price;
                } else {
                    throw new Error("Invalid currency");
                }
                await manager.save(userCurrency);

                const existingItems = await manager.find(UserItem, {
                    where: { accountId, slotIndex: LessThan(1000), chestId: IsNull() }
                });

                const occupiedSlots = new Set(existingItems.map(i => i.slotIndex));

                if (isStackable) {
                    const stackItem = existingItems.find(i => i.itemId === itemId);
                    if (stackItem) {
                        stackItem.quantity += quantity;
                        await manager.save(stackItem);
                    } else {
                        await ShopController.createNewItem(manager, accountId, itemId, quantity, occupiedSlots);
                    }
                } else {
                    for (let i = 0; i < quantity; i++) {
                        await ShopController.createNewItem(manager, accountId, itemId, 1, occupiedSlots);
                    }
                }

                const log = new ShopLog();
                log.accountId = accountId;
                log.itemId = itemId;
                log.quantity = quantity;
                log.priceAtMoment = price;
                log.currency = currency;
                log.totalCost = price;
                log.date = new Date();
                await manager.save(log);

                const inventory = await manager.find(UserItem, { where: { accountId, chestId: IsNull() } });
                res.status(200).json(inventory);
            });
        } catch (error: any) {
            res.status(400).json(error.message);
        }
    }

    private static async createNewItem(manager: any, accountId: string, itemId: number, quantity: number, occupiedSlots: Set<number>) {
        let freeSlot = 0;
        while (occupiedSlots.has(freeSlot) && freeSlot < 40) {
            freeSlot++;
        }
        occupiedSlots.add(freeSlot);

        const newItem = new UserItem();
        newItem.accountId = accountId;
        newItem.itemId = itemId;
        newItem.quantity = quantity;
        newItem.slotIndex = freeSlot;
        newItem.isEquipped = false;
        newItem.rarity = 1;
        newItem.qualityFactor = 1.0;
        newItem.createdAt = new Date();
        
        await manager.save(newItem);
    }
}