import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { SaveData } from '../models/user/SaveData';
import { TimeHelper } from '../utils/TimeHelper';
import { GetSaveDataResponse, SaveGameRequest, SaveGameResponse } from '../DTO/SaveDataDTO';

export class GameDataController {
    
    private static generateMasterSeed(): number {
        return Math.floor(Math.random() * 4294967296);
    }

    public static ping(req: Request, res: Response): void {
        res.status(200).json({ message: "Server is up", serverTime: TimeHelper.getVietnamTime() });
    }

    public static async getSaveData(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const saveData = await ApplicationDbContext.getRepository(SaveData).findOne({ where: { accountId } });

        if (!saveData) {
            res.status(404).json("Không tìm thấy dữ liệu.");
            return;
        }

        const dataSave = saveData.dataSave?.trim().length ? saveData.dataSave : await GameDataController.loadDefaultSaveData();

        const response: GetSaveDataResponse = {
            dataSave,
            masterSeed: GameDataController.generateMasterSeed()
        };

        res.status(200).json(response);
    }

    private static isEmptySaveData(dataSave: unknown): boolean {
        return typeof dataSave !== 'string' || dataSave.trim().length === 0;
    }

    private static async loadDefaultSaveData(): Promise<string> {
        const fs = await import('fs/promises');
        const path = await import('path');
        try {
            const filePath = path.join(process.cwd(), 'src', 'data', 'NewGameSaveData.json');
            return await fs.readFile(filePath, 'utf8');
        } catch {
            return '{}';
        }
    }

    public static async saveGameData(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const { dataSave, reason } = req.body as SaveGameRequest;
        const repo = ApplicationDbContext.getRepository(SaveData);

        const existing = await repo.findOne({ where: { accountId } });

        if (GameDataController.isEmptySaveData(dataSave)) {
            if (existing && existing.dataSave) {
                res.status(400).json("Dữ liệu save trống, thao tác bị hủy để giữ dữ liệu hiện tại.");
                return;
            }

            // Nếu chưa có bản ghi save, khởi tạo với dữ liệu mặc định thay vì lưu chuỗi rỗng.
            const defaultSave = await GameDataController.loadDefaultSaveData();
            const newSave = existing ?? new SaveData();
            newSave.accountId = accountId;
            newSave.dataSave = defaultSave;
            newSave.lastUpdated = new Date();
            await repo.save(newSave);
        } else {
            try {
                JSON.parse(dataSave);
            } catch {
                res.status(400).json("Dữ liệu save bị lỗi cấu trúc.");
                return;
            }

            if (existing) {
                existing.dataSave = dataSave;
                existing.lastUpdated = new Date();
                await repo.save(existing);
            } else {
                const newSave = new SaveData();
                newSave.accountId = accountId;
                newSave.dataSave = dataSave;
                await repo.save(newSave);
            }
        }

        const response: SaveGameResponse = {
            message: "Saved successfully",
            context: reason || "Manual",
            masterSeed: GameDataController.generateMasterSeed()
        };

        res.status(200).json(response);
    }
}