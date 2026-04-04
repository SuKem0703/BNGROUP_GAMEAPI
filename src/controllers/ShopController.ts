import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { UserCurrency } from '../models/user/UserCurrency';
import { UserItem } from '../models/user/UserItem';
import { ShopLog } from '../models/user/ShopLog';
import { ItemDef, ItemType } from '../models/game/ItemDef';
import { IsNull, LessThan } from 'typeorm';

export class ShopController {
    public static async buyItem(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const { itemId, quantity } = req.body;

        try {
            if (!quantity || quantity <= 0) {
                res.status(400).json({ message: 'Quantity must be positive' });
                return;
            }

            if (quantity > 999) {
                res.status(400).json({ message: 'Cannot buy more than 999 items at once' });
                return;
            }

            const itemDef = await ApplicationDbContext.manager.findOne(ItemDef, { where: { id: itemId } });
            if (!itemDef) {
                res.status(400).json({ message: 'Item does not exist in the shop' });
                return;
            }

            const totalCost = itemDef.buyPrice * quantity;
            const currency = itemDef.currency;
            const userCurrency = await ApplicationDbContext.manager.findOne(UserCurrency, { where: { accountId } });

            if (!userCurrency) {
                res.status(400).json({ message: 'Player wallet not found' });
                return;
            }

            if (currency === 'Coin') {
                if (userCurrency.coin < totalCost) {
                    res.status(400).json({ message: 'Not enough Coin' });
                    return;
                }
                userCurrency.coin -= totalCost;
            } else if (currency === 'Gem') {
                if (userCurrency.gem < totalCost) {
                    res.status(400).json({ message: 'Not enough Gem' });
                    return;
                }
                userCurrency.gem -= totalCost;
            } else {
                res.status(400).json({ message: 'Invalid currency configuration for this item' });
                return;
            }

            await ApplicationDbContext.manager.transaction(async (manager) => {
                await manager.save(userCurrency);

                const existingItems = await manager.find(UserItem, {
                    where: { accountId, slotIndex: LessThan(1000), chestId: IsNull() }
                });

                const occupiedSlots = new Set(existingItems.map((i) => i.slotIndex));

                if (itemDef.isStackable) {
                    const stackItem = existingItems.find((i) => i.itemId === itemId);
                    if (stackItem) {
                        stackItem.quantity += quantity;
                        await manager.save(stackItem);
                    } else {
                        await ShopController.createNewItem(manager, accountId, itemDef, quantity, occupiedSlots);
                    }
                } else {
                    for (let i = 0; i < quantity; i++) {
                        await ShopController.createNewItem(manager, accountId, itemDef, 1, occupiedSlots);
                    }
                }
            });

            const inventory = await ApplicationDbContext.manager.find(UserItem, {
                where: { accountId, chestId: IsNull() }
            });

            const log = new ShopLog();
            log.accountId = accountId;
            log.itemId = itemId;
            log.quantity = quantity;
            log.priceAtMoment = itemDef.buyPrice;
            log.currency = currency;
            log.totalCost = totalCost;
            await ApplicationDbContext.manager.save(log);

            res.status(200).json(inventory);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    public static async getShopItems(req: Request, res: Response): Promise<void> {
        const search = String(req.query.search || '').trim().toLowerCase();

        const repo = ApplicationDbContext.getRepository(ItemDef);
        const items = await repo.find({ order: { buyPrice: 'ASC' } });

        const filtered = items.filter((item) => {
            if (!search) return true;
            return [
                String(item.id),
                item.name,
                item.description || '',
                item.currency,
                item.itemType,
            ].some((value) => value.toLowerCase().includes(search));
        });

        res.status(200).json(filtered.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            itemType: item.itemType,
            isStackable: item.isStackable,
            buyPrice: item.buyPrice,
            currency: item.currency,
        })));
    }

    private static async createNewItem(manager: any, accountId: string, itemDef: ItemDef, quantity: number, occupiedSlots: Set<number>) {
        let freeSlot = 0;

        while (occupiedSlots.has(freeSlot)) {
            freeSlot++;
        }

        if (freeSlot >= 40) {
            throw new Error('Inventory is full! Please make some space.');
        }

        occupiedSlots.add(freeSlot);

        const newItem = new UserItem();
        newItem.accountId = accountId;
        newItem.itemId = itemDef.id;
        newItem.quantity = itemDef.itemType === ItemType.Equipment ? 1 : quantity;
        newItem.slotIndex = freeSlot;
        newItem.isEquipped = false;
        newItem.rarity = 1;
        newItem.qualityFactor = 1.0;
        newItem.createdAt = new Date();

        await manager.save(newItem);
    }
}
