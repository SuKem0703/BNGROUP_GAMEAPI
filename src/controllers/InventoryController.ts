import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { UserItem } from '../models/user/UserItem';
import { SaveData } from '../models/user/SaveData';
import { AddItemRequestDTO, EquipItemRequestDTO, MoveItemRequestDTO, RemoveItemRequestDTO, UpdateQuantityRequestDTO } from '../DTO/InventoryDTO';
import { ItemGenerationHelper, SeededRandom } from '../utils/ItemGenerationHelper';
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
        const data = req.body as EquipItemRequestDTO;

        const repo = ApplicationDbContext.getRepository(UserItem);
        const item = await repo.findOne({ where: { id: data.itemDbId, accountId } });

        if (!item) {
            res.status(404).json("Item không tồn tại hoặc đã bị xóa.");
            return;
        }

        item.isEquipped = data.isEquipped;
        await repo.save(item);

        res.status(200).json({ success: true });
    }

    public static async moveItem(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const data = req.body as MoveItemRequestDTO;
        const repo = ApplicationDbContext.getRepository(UserItem);

        const sourceItem = await repo.findOne({ where: { id: data.itemDbId, accountId } });
        if (!sourceItem) {
            res.status(404).json({ message: "Source item not found" });
            return;
        }

        const targetItem = await repo.findOne({
            where: { accountId, slotIndex: data.newSlotIndex, chestId: sourceItem.chestId ?? IsNull() }
        });

        if (!targetItem) {
            sourceItem.slotIndex = data.newSlotIndex;
            await repo.save(sourceItem);
        } else {
            if (data.isStackable && targetItem.itemId === sourceItem.itemId) {
                targetItem.quantity += sourceItem.quantity;
                await repo.save(targetItem);
                await repo.remove(sourceItem);
            } else {
                const tempSlot = targetItem.slotIndex;
                targetItem.slotIndex = sourceItem.slotIndex;
                sourceItem.slotIndex = data.newSlotIndex; 
                await repo.save([targetItem, sourceItem]);
            }
        }

        res.status(200).json({ success: true });
    }

    public static async addItem(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const data = req.body as AddItemRequestDTO;
        
        const itemIdNum = Number(data.itemId);
        const quantity = Number(data.quantity);

        const repo = ApplicationDbContext.getRepository(UserItem);

        if (data.isStackable) {
            const existingItem = await repo.findOne({
                where: { accountId, itemId: itemIdNum, chestId: IsNull() }
            });

            if (existingItem) {
                existingItem.quantity += quantity;
                await repo.save(existingItem);
                res.status(200).json({ success: true, dbId: existingItem.id, action: "stacked" });
                return;
            }
        }

        let finalSlot = data.slotIndex;
        let finalRarity = data.rarity ?? 1;
        let finalQuality = data.qualityFactor ?? 1;

        if (data.validationSeed && data.validationSeed > 0) {
            const rng = new SeededRandom(data.validationSeed);
            const expectedRarity = ItemGenerationHelper.getRandomRarity(rng);
            const expectedQuality = ItemGenerationHelper.getWeightedQualityFactor(rng);

            if (expectedRarity !== finalRarity || Math.abs(expectedQuality - finalQuality) > 0.01) {
                console.warn(`[Anti-Cheat] Phát hiện gian lận từ Account ${accountId}. Chỉ số không khớp với Seed ${data.validationSeed}.`);
                
                res.status(403).json({ 
                    success: false, 
                    message: "Phát hiện dữ liệu vật phẩm không hợp lệ! Hành động đã bị hủy." 
                });
                return;
            }
        }

        const newItem = repo.create({
            accountId,
            itemId: itemIdNum,
            quantity: quantity,
            slotIndex: finalSlot,
            isEquipped: false,
            rarity: finalRarity,
            qualityFactor: finalQuality
        });

        await repo.save(newItem);
        res.status(200).json({ success: true, dbId: newItem.id, action: "created" });
    }

    public static async updateQuantity(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const data = req.body as UpdateQuantityRequestDTO;
        const repo = ApplicationDbContext.getRepository(UserItem);

        const item = await repo.findOne({ where: { id: data.itemDbId, accountId } });
        if (!item) {
            res.status(404).json({ message: "Item not found" });
            return;
        }

        item.quantity = data.newQuantity;
        if (item.quantity <= 0) {
            await repo.remove(item);
        } else {
            await repo.save(item);
        }

        res.status(200).json({ success: true });
    }

    public static async removeItem(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const data = req.body as RemoveItemRequestDTO;
        const repo = ApplicationDbContext.getRepository(UserItem);

        const item = await repo.findOne({ where: { id: data.itemDbId, accountId } });
        if (!item) {
            res.status(404).json({ message: "Item not found" });
            return;
        }

        await repo.remove(item);
        res.status(200).json({ success: true });
    }
}