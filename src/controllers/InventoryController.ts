import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { UserItem } from '../models/user/UserItem';
import { SaveData } from '../models/user/SaveData';
import { AddItemRequestDTO, EquipItemRequestDTO, MoveItemRequestDTO, RemoveItemRequestDTO, UpdateQuantityRequestDTO } from '../DTO/InventoryDTO';
import { ItemGenerationHelper, SeededRandom } from '../utils/ItemGenerationHelper';
import { IsNull, LessThan } from 'typeorm';

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
            if (migratedItems.length > 0) await repo.save(migratedItems);
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

    // Thao tác mặc đồ
    public static async setEquipState(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const data = req.body as EquipItemRequestDTO;

        const repo = ApplicationDbContext.getRepository(UserItem);
        const item = await repo.findOne({ where: { id: data.itemDbId, accountId } });

        if (!item) {
            res.status(404).json("Vật phẩm không tồn tại hoặc bạn không có quyền sở hữu.");
            return;
        }

        item.isEquipped = data.isEquipped;
        await repo.save(item);
        res.status(200).json({ success: true });
    }

    // Logic Di chuyển / Cộng dồn / Hoán đổi / Tích hợp, Xử lý Swap
    public static async moveItem(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const data = req.body as MoveItemRequestDTO;
        const repo = ApplicationDbContext.getRepository(UserItem);

        await ApplicationDbContext.transaction(async (transactionalEntityManager) => {
            const sourceItem = await transactionalEntityManager.findOne(UserItem, { 
                where: { id: data.itemDbId, accountId } 
            });

            if (!sourceItem) throw new Error("Source item not found");

            const targetItem = await transactionalEntityManager.findOne(UserItem, {
                where: { accountId, slotIndex: data.newSlotIndex, chestId: sourceItem.chestId ?? IsNull() }
            });

            if (!targetItem) {
                sourceItem.slotIndex = data.newSlotIndex;
                sourceItem.isEquipped = data.newSlotIndex >= 2000;
                await transactionalEntityManager.save(sourceItem);
            } else {
                if (data.isStackable && targetItem.itemId === sourceItem.itemId) {
                    targetItem.quantity += sourceItem.quantity;
                    await transactionalEntityManager.save(targetItem);
                    await transactionalEntityManager.remove(sourceItem);
                } else {
                    const oldSourceSlot = sourceItem.slotIndex;
                    targetItem.slotIndex = oldSourceSlot;
                    sourceItem.slotIndex = data.newSlotIndex;

                    targetItem.isEquipped = targetItem.slotIndex >= 2000;
                    sourceItem.isEquipped = sourceItem.slotIndex >= 2000;

                    const itemsToSave = [sourceItem, targetItem].sort((a, b) => a.id - b.id);
                    await transactionalEntityManager.save(itemsToSave);
                }
            }
        });

        res.status(200).json({ success: true });
    }

    // Thêm vật phẩm
    public static async addItem(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const data = req.body as AddItemRequestDTO;
        
        const itemIdNum = Number(data.itemId);
        const quantity = Number(data.quantity);
        const repo = ApplicationDbContext.getRepository(UserItem);

        if (data.isStackable) {
            const existingItem = await repo.findOne({
                where: { 
                    accountId, 
                    itemId: itemIdNum, 
                    chestId: IsNull(),
                    slotIndex: LessThan(2000)
                }
            });

            if (existingItem) {
                existingItem.quantity += quantity;
                await repo.save(existingItem);
                res.status(200).json({ success: true, dbId: existingItem.id, action: "stacked" });
                return;
            }
        }

        // Logic Anti-Cheat với Seed
        let finalRarity = data.rarity ?? 1;
        let finalQuality = data.qualityFactor ?? 1;

        if (data.validationSeed && data.validationSeed > 0) {
            const rng = new SeededRandom(data.validationSeed);
            const expectedRarity = ItemGenerationHelper.getRandomRarity(rng);
            const expectedQuality = ItemGenerationHelper.getWeightedQualityFactor(rng);

            if (expectedRarity !== finalRarity || Math.abs(expectedQuality - finalQuality) > 0.01) {
                console.warn(`[Anti-Cheat] Account ${accountId} cố gắng hack chỉ số.`);
                res.status(403).json({ success: false, message: "Dữ liệu không hợp lệ!" });
                return;
            }
        }

        const currentSlot = data.slotIndex ?? 0;

        const newItem = repo.create({
        accountId,
        itemId: itemIdNum,
        quantity: quantity,
        slotIndex: currentSlot,
        isEquipped: currentSlot >= 2000, 
        rarity: finalRarity,
        qualityFactor: finalQuality
    });

        await repo.save(newItem);
        res.status(200).json({ success: true, dbId: newItem.id, action: "created" });
    }
    
    // Cập nhật số lượng
    public static async updateQuantity(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const data = req.body as UpdateQuantityRequestDTO;
        const repo = ApplicationDbContext.getRepository(UserItem);

        const item = await repo.findOne({ where: { id: data.itemDbId, accountId } });
        if (!item) {
            res.status(404).json({ message: "Không tìm thấy vật phẩm hoặc sai quyền sở hữu." });
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

    // Xóa vật phẩm
    public static async removeItem(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const data = req.body as RemoveItemRequestDTO;
        const repo = ApplicationDbContext.getRepository(UserItem);

        // Ownership Check
        const item = await repo.findOne({ where: { id: data.itemDbId, accountId } });
        if (!item) {
            res.status(404).json({ message: "Không tìm thấy vật phẩm hoặc sai quyền sở hữu." });
            return;
        }

        await repo.remove(item);
        res.status(200).json({ success: true });
    }
}