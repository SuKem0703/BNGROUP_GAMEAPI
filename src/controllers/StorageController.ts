import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { StorageItem } from '../models/user/StorageItem';
import { UserItem } from '../models/user/UserItem';
import { IsNull, Like } from 'typeorm';

export class StorageController {
    public static async getMapStorage(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const sceneName = req.query.sceneName as string;

        if (!sceneName) {
            res.status(400).json("Scene name is required");
            return;
        }

        const items = await ApplicationDbContext.getRepository(StorageItem).find({
            where: { accountId, chestId: Like(`${sceneName}_%`) }
        });
        res.status(200).json(items);
    }

    public static async getSingleChest(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const chestId = req.query.chestId as string;

        const items = await ApplicationDbContext.getRepository(StorageItem).find({
            where: { accountId, chestId }
        });
        res.status(200).json(items);
    }

    public static async depositItem(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const { itemDbId, chestId, slotIndex, isStackable } = req.body;

        try {
            await ApplicationDbContext.manager.transaction(async (manager) => {
                const sourceItem = await manager.findOne(UserItem, {
                    where: { id: itemDbId, accountId, chestId: IsNull() }
                });

                if (!sourceItem) throw new Error("Source item not found in Inventory");

                const targetItem = await manager.findOne(StorageItem, {
                    where: { accountId, chestId, slotIndex }
                });

                if (!targetItem) {
                    const newStorageItem = new StorageItem();
                    newStorageItem.accountId = accountId;
                    newStorageItem.chestId = chestId;
                    newStorageItem.slotIndex = slotIndex;
                    newStorageItem.itemId = sourceItem.itemId;
                    newStorageItem.quantity = sourceItem.quantity;
                    newStorageItem.rarity = sourceItem.rarity;
                    newStorageItem.qualityFactor = sourceItem.qualityFactor;
                    newStorageItem.depositedAt = new Date();

                    await manager.save(newStorageItem);
                    await manager.remove(sourceItem);
                } else {
                    if (isStackable && targetItem.itemId === sourceItem.itemId) {
                        targetItem.quantity += sourceItem.quantity;
                        await manager.save(targetItem);
                        await manager.remove(sourceItem);
                    } else {
                        const newUserItem = new UserItem();
                        newUserItem.accountId = accountId;
                        newUserItem.slotIndex = sourceItem.slotIndex;
                        newUserItem.itemId = targetItem.itemId;
                        newUserItem.quantity = targetItem.quantity;
                        newUserItem.rarity = targetItem.rarity;
                        newUserItem.qualityFactor = targetItem.qualityFactor;
                        newUserItem.isEquipped = false;
                        newUserItem.createdAt = new Date();

                        targetItem.itemId = sourceItem.itemId;
                        targetItem.quantity = sourceItem.quantity;
                        targetItem.rarity = sourceItem.rarity;
                        targetItem.qualityFactor = sourceItem.qualityFactor;
                        targetItem.depositedAt = new Date();

                        await manager.save(newUserItem);
                        await manager.save(targetItem);
                        await manager.remove(sourceItem);
                    }
                }
            });
            res.status(200).json({ success: true });
        } catch (error: any) {
            res.status(500).json("Transaction failed: " + error.message);
        }
    }

    public static async withdrawItem(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const { itemDbId, slotIndex, isStackable } = req.body;

        try {
            await ApplicationDbContext.manager.transaction(async (manager) => {
                const sourceItem = await manager.findOne(StorageItem, {
                    where: { id: itemDbId, accountId }
                });

                if (!sourceItem) throw new Error("Source item not found in Storage");

                const targetItem = await manager.findOne(UserItem, {
                    where: { accountId, slotIndex, chestId: IsNull() }
                });

                if (!targetItem) {
                    const newUserItem = new UserItem();
                    newUserItem.accountId = accountId;
                    newUserItem.slotIndex = slotIndex;
                    newUserItem.itemId = sourceItem.itemId;
                    newUserItem.quantity = sourceItem.quantity;
                    newUserItem.rarity = sourceItem.rarity;
                    newUserItem.qualityFactor = sourceItem.qualityFactor;
                    newUserItem.isEquipped = false;
                    newUserItem.createdAt = new Date();

                    await manager.save(newUserItem);
                    await manager.remove(sourceItem);
                } else {
                    if (isStackable && targetItem.itemId === sourceItem.itemId) {
                        targetItem.quantity += sourceItem.quantity;
                        await manager.save(targetItem);
                        await manager.remove(sourceItem);
                    } else {
                        const newStorageItem = new StorageItem();
                        newStorageItem.accountId = accountId;
                        newStorageItem.chestId = sourceItem.chestId;
                        newStorageItem.slotIndex = sourceItem.slotIndex;
                        newStorageItem.itemId = targetItem.itemId;
                        newStorageItem.quantity = targetItem.quantity;
                        newStorageItem.rarity = targetItem.rarity;
                        newStorageItem.qualityFactor = targetItem.qualityFactor;
                        newStorageItem.depositedAt = new Date();

                        targetItem.itemId = sourceItem.itemId;
                        targetItem.quantity = sourceItem.quantity;
                        targetItem.rarity = sourceItem.rarity;
                        targetItem.qualityFactor = sourceItem.qualityFactor;
                        targetItem.isEquipped = false;

                        await manager.save(newStorageItem);
                        await manager.save(targetItem);
                        await manager.remove(sourceItem);
                    }
                }
            });
            res.status(200).json({ success: true });
        } catch (error: any) {
            res.status(500).json("Transaction failed: " + error.message);
        }
    }
}