import { Request, Response } from 'express';
import { In } from "typeorm";
import { ApplicationDbContext } from '../config/database';
import { FarmPlot } from '../models/user/FarmPlot';
import { TimeHelper } from '../utils/TimeHelper';

export class FarmController {
    public static async syncFarm(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const plots = await ApplicationDbContext.getRepository(FarmPlot).find({
            where: { accountId }
        });
        
        // Trả về kèm thời gian hiện tại của Server để Client dễ đồng bộ
        res.status(200).json({ 
            serverTime: TimeHelper.getVietnamTime(), 
            plots 
        });
    }

    public static async plantSeed(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const { plotId, seedItemId } = req.body;

        const repo = ApplicationDbContext.getRepository(FarmPlot);
        let plot = await repo.findOne({ where: { accountId, plotId } });

        if (plot) {
            // Ghi đè nếu ô đất đã có (phòng hờ lỗi đồng bộ)
            plot.seedItemId = seedItemId;
            plot.plantedAt = TimeHelper.getVietnamTime();
        } else {
            plot = new FarmPlot();
            plot.accountId = accountId;
            plot.plotId = plotId;
            plot.seedItemId = seedItemId;
            plot.plantedAt = TimeHelper.getVietnamTime();
        }

        await repo.save(plot);
        res.status(200).json({ success: true, plantedAt: plot.plantedAt });
    }

    public static async harvestCrop(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const { actions } = req.body;

        if (!actions || !Array.isArray(actions) || actions.length === 0) {
            res.status(400).json("Danh sách thu hoạch trống.");
            return;
        }

        const repo = ApplicationDbContext.getRepository(FarmPlot);
        
        const plotIds = actions.map((a: any) => a.plotId);

        const plots = await repo.find({
            where: { accountId: accountId, plotId: In(plotIds) }
        });

        const plotsToRemove: FarmPlot[] = [];
        const plotsToUpdate: FarmPlot[] = [];
        const now = TimeHelper.getVietnamTime();

        for (const action of actions) {
            const plot = plots.find(p => p.plotId === action.plotId);
            if (!plot) continue;

            if (action.isRegrowable) {
                const newPlantedAt = new Date(now.getTime());
                newPlantedAt.setSeconds(newPlantedAt.getSeconds() - (action.offsetSeconds || 0));
                plot.plantedAt = newPlantedAt;
                plotsToUpdate.push(plot);
            } else {
                plotsToRemove.push(plot);
            }
        }

        await ApplicationDbContext.manager.transaction(async manager => {
            if (plotsToUpdate.length > 0) {
                await manager.save(plotsToUpdate);
            }
            if (plotsToRemove.length > 0) {
                await manager.remove(plotsToRemove);
            }
        });

        res.status(200).json({ success: true, processed: actions.length });
    }
}