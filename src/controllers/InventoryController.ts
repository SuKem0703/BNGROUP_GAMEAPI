import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { UserItem } from '../models/user/UserItem';
import { SaveData } from '../models/user/SaveData';
import { AddItemRequest } from '../DTO/AddItemRequest';
import { IsNull } from 'typeorm';

export class InventoryController {
    private static async migrateOldDataIfNeeded(accountId: string): Promise<void> {
        const repo = ApplicationDbContext.getRepository(UserItem);
        const hasItems = await repo.exist({ where: { accountId } });
        if (hasItems) return;

        const oldSave = await ApplicationDbContext.getRepository(SaveData).findOne({ where: { accountId } });
        if (!oldSave || !oldSave.dataSave) return;

        try {
            const oldData = JSON.parse(oldSave.dataSave);
            const migratedItems: UserItem[] = [];

            if (oldData.inventorySaveData) {
                for (const item of oldData.inventorySaveData) {
                    const ui = new UserItem();
                    ui.accountId = accountId;
                    ui.itemId = item.itemID;
                    ui.quantity = item.quantity;
                    ui.slotIndex = item.slotIndex;
                    ui.isEquipped = item.isEquipped;
                    ui.rarity = item.rarity;
                    ui.qualityFactor = item.qualityFactor;
                    migratedItems.push(ui);
                }
            }

            if (oldData.hotbarSaveData) {
                for (const item of oldData.hotbarSaveData) {
                    const ui = new UserItem();
                    ui.accountId = accountId;
                    ui.itemId = item.itemID;
                    ui.quantity = item.quantity;
                    ui.slotIndex = item.slotIndex + 1000;
                    ui.isEquipped = false;
                    ui.rarity = item.rarity;
                    ui.qualityFactor = item.qualityFactor;
                    migratedItems.push(ui);
                }
            }

            if (migratedItems.length > 0) {
                await repo.save(migratedItems);
            }
        } catch { }
    }

    public static async getInventory(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        await InventoryController.migrateOldDataIfNeeded(accountId);

        const items = await ApplicationDbContext.getRepository(UserItem).find({
            where: { accountId, chestId: IsNull() }
        });

        res.status(200).json(items);
    }

    public static async setEquipState(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const { itemDbId, isEquipped } = req.body;

        const repo = ApplicationDbContext.getRepository(UserItem);
        const item = await repo.findOne({ where: { id: itemDbId, accountId } });

        if (!item) {
            res.status(404).json("Item không tồn tại hoặc đã bị xóa.");
            return;
        }

        item.isEquipped = isEquipped;
        await repo.save(item);

        res.status(200).json({ success: true });
    }

    public static async moveItem(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const { itemDbId, newSlotIndex, isStackable } = req.body;
        const repo = ApplicationDbContext.getRepository(UserItem);

        const sourceItem = await repo.findOne({ where: { id: itemDbId, accountId } });
        if (!sourceItem) {
            res.status(404).json({ message: "Source item not found" });
            return;
        }

        const targetItem = await repo.findOne({
            where: { accountId, slotIndex: newSlotIndex, chestId: sourceItem.chestId ?? IsNull() }
        });

        if (!targetItem) {
            sourceItem.slotIndex = newSlotIndex;
            await repo.save(sourceItem);
        } else {
            if (isStackable && targetItem.itemId === sourceItem.itemId) {
                targetItem.quantity += sourceItem.quantity;
                await repo.save(targetItem);
                await repo.remove(sourceItem);
            } else {
                const tempSlot = targetItem.slotIndex;
                targetItem.slotIndex = sourceItem.slotIndex;
                sourceItem.slotIndex = newSlotIndex; 
                await repo.save([targetItem, sourceItem]);
            }
        }

        res.status(200).json({ success: true });
    }

    public static async addItem(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        
        const data: AddItemRequest = req.body;
        
        const itemIdNum = Number(data.itemId);
        const quantity = Number(data.quantity);

        const repo = ApplicationDbContext.getRepository(UserItem);

        const existingItem = await repo.findOne({
            where: { accountId, itemId: itemIdNum, chestId: IsNull() }
        });

        if (existingItem) {
            existingItem.quantity += quantity;
            await repo.save(existingItem);
            res.status(200).json({ success: true, dbId: existingItem.id, action: "stacked" });
            return;
        }

        let finalSlot = data.slotIndex;
        if (finalSlot === undefined || finalSlot === null) {
            const occupiedSlots = await repo.find({
                where: { accountId, chestId: IsNull() },
                select: ["slotIndex"],
                order: { slotIndex: "ASC" }
            });
            
            let candidate = 0;
            for (const item of occupiedSlots) {
                if (item.slotIndex === candidate) candidate++;
                else break;
            }
            finalSlot = candidate;
        }

        const newItem = repo.create({
            accountId,
            itemId: itemIdNum,
            quantity: quantity,
            slotIndex: finalSlot,
            isEquipped: false,
            rarity: data.rarity ?? 1,
            qualityFactor: data.qualityFactor ?? 1,
            createdAt: new Date()
        });

        await repo.save(newItem);
        res.status(200).json({ success: true, dbId: newItem.id, action: "created" });
    }

    public static async updateQuantity(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const { itemDbId, newQuantity } = req.body;
        const repo = ApplicationDbContext.getRepository(UserItem);

        const item = await repo.findOne({ where: { id: itemDbId, accountId } });
        if (!item) {
            res.status(404).json({ message: "Item not found" });
            return;
        }

        item.quantity = newQuantity;
        if (item.quantity <= 0) {
            await repo.remove(item);
        } else {
            await repo.save(item);
        }

        res.status(200).json({ success: true });
    }

    public static async removeItem(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const { itemDbId } = req.body;
        const repo = ApplicationDbContext.getRepository(UserItem);

        const item = await repo.findOne({ where: { id: itemDbId, accountId } });
        if (!item) {
            res.status(404).json({ message: "Item not found" });
            return;
        }

        await repo.remove(item);
        res.status(200).json({ success: true });
    }
}