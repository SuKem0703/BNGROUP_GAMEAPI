import fs from 'fs';
import path from 'path';
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
            rarity: item.rarity,
            buyPrice: item.buyPrice,
            sellPrice: item.sellPrice,
            currency: item.currency,
            imageUrl: item.imageUrl ?? null,
        })));
    }

    public static async getShopItemsForAdmin(req: Request, res: Response): Promise<void> {
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
            rarity: item.rarity,
            buyPrice: item.buyPrice,
            sellPrice: item.sellPrice,
            currency: item.currency,
            imageUrl: item.imageUrl ?? null,
        })));
    }

    public static async createShopItem(req: Request, res: Response): Promise<void> {
        const {
            id,
            name,
            description,
            itemType,
            isStackable,
            rarity,
            buyPrice,
            sellPrice,
            currency,
            imageUrl,
        } = req.body;

        if (!id || !name || !itemType || typeof isStackable !== 'boolean') {
            res.status(400).json({ message: 'Missing required item fields.' });
            return;
        }

        try {
            const existing = await ApplicationDbContext.manager.findOne(ItemDef, { where: { id } });
            if (existing) {
                res.status(400).json({ message: 'Item ID already exists.' });
                return;
            }

            const itemDef = new ItemDef();
            itemDef.id = id;
            itemDef.name = name;
            itemDef.description = description || null;
            itemDef.itemType = itemType;
            itemDef.isStackable = isStackable;
            itemDef.rarity = Number.isFinite(rarity) ? Number(rarity) : 1;
            itemDef.buyPrice = Number.isFinite(buyPrice) ? Number(buyPrice) : 0;
            itemDef.sellPrice = Number.isFinite(sellPrice) ? Number(sellPrice) : 0;
            itemDef.currency = currency;
            itemDef.imageUrl = imageUrl || null;

            await ApplicationDbContext.manager.save(itemDef);
            res.status(201).json(itemDef);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    public static async updateShopItem(req: Request, res: Response): Promise<void> {
        const itemId = Number(req.params.itemId);
        if (!itemId || itemId <= 0) {
            res.status(400).json({ message: 'Invalid itemId.' });
            return;
        }

        const {
            name,
            description,
            itemType,
            isStackable,
            rarity,
            buyPrice,
            sellPrice,
            currency,
            imageUrl,
        } = req.body;

        try {
            const itemDef = await ApplicationDbContext.manager.findOne(ItemDef, { where: { id: itemId } });
            if (!itemDef) {
                res.status(404).json({ message: 'Item not found.' });
                return;
            }

            if (name !== undefined) itemDef.name = name;
            if (description !== undefined) itemDef.description = description;
            if (itemType !== undefined) itemDef.itemType = itemType;
            if (isStackable !== undefined) itemDef.isStackable = isStackable;
            if (rarity !== undefined) itemDef.rarity = Number(rarity);
            if (buyPrice !== undefined) itemDef.buyPrice = Number(buyPrice);
            if (sellPrice !== undefined) itemDef.sellPrice = Number(sellPrice);
            if (currency !== undefined) itemDef.currency = currency;
            if (imageUrl !== undefined) itemDef.imageUrl = imageUrl;

            await ApplicationDbContext.manager.save(itemDef);
            res.status(200).json(itemDef);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    public static async deleteShopItem(req: Request, res: Response): Promise<void> {
        const itemId = Number(req.params.itemId);
        if (!itemId || itemId <= 0) {
            res.status(400).json({ message: 'Invalid itemId.' });
            return;
        }

        try {
            const itemDef = await ApplicationDbContext.manager.findOne(ItemDef, { where: { id: itemId } });
            if (!itemDef) {
                res.status(404).json({ message: 'Item not found.' });
                return;
            }

            const ownedCount = await ApplicationDbContext.manager.count(UserItem, { where: { itemId } });
            if (ownedCount > 0) {
                res.status(400).json({ message: 'Cannot delete item while players still own it.' });
                return;
            }

            await ApplicationDbContext.manager.remove(itemDef);
            res.status(200).json({ message: 'Item deleted successfully.' });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    public static async updateShopItemImage(req: Request, res: Response): Promise<void> {
        const itemId = Number(req.params.itemId);
        const { imageBase64, filename } = req.body;

        if (!itemId || itemId <= 0) {
            res.status(400).json({ message: 'Invalid itemId' });
            return;
        }

        if (!imageBase64 || typeof imageBase64 !== 'string') {
            res.status(400).json({ message: 'imageBase64 is required' });
            return;
        }

        try {
            const itemDef = await ApplicationDbContext.manager.findOne(ItemDef, { where: { id: itemId } });
            if (!itemDef) {
                res.status(404).json({ message: 'Item not found' });
                return;
            }

            let rawBase64 = imageBase64;
            let extension = 'png';
            const dataUriMatch = imageBase64.match(/^data:(image\/(png|jpeg|jpg|gif));base64,(.+)$/i);
            if (dataUriMatch) {
                const mimeType = dataUriMatch[1];
                rawBase64 = dataUriMatch[3];
                extension = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
            } else if (filename) {
                const extFromFilename = path.extname(filename).replace('.', '').toLowerCase();
                if (['png', 'jpg', 'jpeg', 'gif'].includes(extFromFilename)) {
                    extension = extFromFilename === 'jpeg' ? 'jpg' : extFromFilename;
                }
            }

            const buffer = Buffer.from(rawBase64, 'base64');
            const mediaDir = path.join(process.cwd(), 'public', 'media', 'shop-items');
            await fs.promises.mkdir(mediaDir, { recursive: true });

            const safeFilename = `item-${itemId}.${extension}`;
            const filePath = path.join(mediaDir, safeFilename);
            await fs.promises.writeFile(filePath, buffer);

            itemDef.imageUrl = `/media/shop-items/${safeFilename}`;
            await ApplicationDbContext.manager.save(itemDef);

            res.status(200).json({ id: itemDef.id, imageUrl: itemDef.imageUrl });
        } catch (error: any) {
            res.status(500).json({ message: error?.message || 'Unable to upload image' });
        }
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
