import { Request, Response } from 'express';
import { In, LessThan, IsNull } from "typeorm";
import { ApplicationDbContext } from '../config/database';
import { FarmPlot } from '../models/user/FarmPlot';
import { UserItem } from '../models/user/UserItem';
import { TimeHelper } from '../utils/TimeHelper';
import { BulkHarvestRequestDTO, PlantSeedRequestDTO } from '../DTO/FarmDTO';
import { CropConfig } from '../config/CropConfig';

export class FarmController {
    public static async syncFarm(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const plots = await ApplicationDbContext.getRepository(FarmPlot).find({
            where: { accountId }
        });
        
        res.status(200).json({ 
            serverTime: TimeHelper.getVietnamTime(), 
            plots 
        });
    }

    public static async plantSeed(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const data = req.body as PlantSeedRequestDTO;

        const repo = ApplicationDbContext.getRepository(FarmPlot);
        let plot = await repo.findOne({ where: { accountId, plotId: data.plotId } });

        if (plot) {
            plot.seedItemId = data.seedItemId;
            plot.plantedAt = TimeHelper.getVietnamTime();
        } else {
            plot = new FarmPlot();
            plot.accountId = accountId;
            plot.plotId = data.plotId;
            plot.seedItemId = data.seedItemId;
            plot.plantedAt = TimeHelper.getVietnamTime();
        }

        await repo.save(plot);
        res.status(200).json({ success: true, plantedAt: plot.plantedAt });
    }

    public static async harvestCrop(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const data = req.body as BulkHarvestRequestDTO;

        if (!data.plotIds || !Array.isArray(data.plotIds) || data.plotIds.length === 0) {
            res.status(400).json("Danh sách thu hoạch trống.");
            return;
        }

        const farmRepo = ApplicationDbContext.getRepository(FarmPlot);
        
        const plots = await farmRepo.find({
            where: { accountId: accountId, plotId: In(data.plotIds) }
        });

        const plotsToRemove: FarmPlot[] = [];
        const plotsToUpdate: FarmPlot[] = [];
        
        const harvestedItemsAggregated: Record<number, number> = {}; 

        const now = TimeHelper.getVietnamTime();

        for (const plot of plots) {
            const config = CropConfig[plot.seedItemId];
            if (!config) {
                console.warn(`[Farm] Cấu hình không tồn tại cho hạt giống: ${plot.seedItemId}`);
                continue;
            }

            const secondsElapsed = (now.getTime() - plot.plantedAt.getTime()) / 1000;
            
            if (secondsElapsed + 2 < config.totalGrowthTime) {
                console.warn(`[Anti-Cheat] Account ${accountId} cố gắng thu hoạch sớm ô ${plot.plotId}!`);
                continue; 
            }

            if (!harvestedItemsAggregated[config.harvestItemId]) {
                harvestedItemsAggregated[config.harvestItemId] = 0;
            }
            harvestedItemsAggregated[config.harvestItemId] += config.harvestAmount;

            if (config.isRegrowable) {
                const newPlantedAt = new Date(now.getTime());
                newPlantedAt.setSeconds(newPlantedAt.getSeconds() - config.regrowOffset);
                plot.plantedAt = newPlantedAt;
                plotsToUpdate.push(plot);
            } else {
                plotsToRemove.push(plot);
            }
        }

        await ApplicationDbContext.manager.transaction(async manager => {
            if (plotsToUpdate.length > 0) await manager.save(plotsToUpdate);
            if (plotsToRemove.length > 0) await manager.remove(plotsToRemove);

            for (const itemIdStr in harvestedItemsAggregated) {
                const itemId = Number(itemIdStr);
                const quantity = harvestedItemsAggregated[itemId];

                const existingItem = await manager.findOne(UserItem, {
                    where: { accountId, itemId: itemId, chestId: IsNull(), slotIndex: LessThan(2000) }
                });

                if (existingItem) {
                    existingItem.quantity += quantity;
                    await manager.save(existingItem);
                } else {
                    const allItems = await manager.find(UserItem, { where: { accountId, chestId: IsNull(), slotIndex: LessThan(1000) } });
                    const occupiedSlots = new Set(allItems.map(i => i.slotIndex));
                    let freeSlot = 0;
                    while (occupiedSlots.has(freeSlot)) freeSlot++;

                    const newItem = manager.create(UserItem, {
                        accountId,
                        itemId: itemId,
                        quantity: quantity,
                        slotIndex: freeSlot,
                        isEquipped: false,
                        rarity: 1,
                        qualityFactor: 1
                    });
                    await manager.save(newItem);
                }
            }
        });

        res.status(200).json({ success: true, processed: plotsToUpdate.length + plotsToRemove.length });
    }
}