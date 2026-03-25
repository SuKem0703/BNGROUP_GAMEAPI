import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { FarmPlot } from '../models/user/FarmPlot';
import { TimeHelper } from '../utils/TimeHelper';

export class FarmController {
    // 1. Lấy toàn bộ nông trại của user
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

    // 2. Trồng cây
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

    // 3. Thu hoạch (Hoặc Regrow)
    public static async harvestCrop(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const { plotId, isRegrowable, offsetSeconds } = req.body;

        const repo = ApplicationDbContext.getRepository(FarmPlot);
        const plot = await repo.findOne({ where: { accountId, plotId } });

        if (!plot) {
            res.status(404).json("Không tìm thấy dữ liệu ô đất.");
            return;
        }

        if (isRegrowable) {
            // Nếu cây nảy mầm lại, ta tịnh tiến thời gian PlantedAt lên hiện tại trừ đi thời gian nảy mầm
            const newPlantedAt = TimeHelper.getVietnamTime();
            newPlantedAt.setSeconds(newPlantedAt.getSeconds() - (offsetSeconds || 0));
            plot.plantedAt = newPlantedAt;
            await repo.save(plot);
        } else {
            // Nếu thu hoạch xong mất cây -> Xóa khỏi Database
            await repo.remove(plot);
        }

        res.status(200).json({ success: true });
    }
}