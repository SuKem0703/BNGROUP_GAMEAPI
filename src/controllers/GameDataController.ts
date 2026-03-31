import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { Account, AccountStatus } from '../models/user/Account';
import { SaveData } from '../models/user/SaveData';
import { PasswordHasher } from '../utils/PasswordHasher';
import { JwtHelper } from '../utils/JwtHelper';
import { TimeHelper } from '../utils/TimeHelper';

export class GameDataController {
    public static async login(req: Request, res: Response): Promise<void> {
        const { username, password } = req.body;

        const account = await ApplicationDbContext.getRepository(Account).findOne({ 
            where: { username },
            relations: ['role']
        });

        if (!account || !PasswordHasher.verify(password, account.passwordHash)) {
            res.status(401).json("Sai tên người dùng hoặc mật khẩu.");
            return;
        }

        if (account.status === AccountStatus.Ban) {
            res.status(403).json("Tài khoản đã bị khóa.");
            return;
        }

        const secretKey = process.env.JWT_SECRET || 'default_secret_key_32_chars_long';
        const issuer = process.env.JWT_ISSUER || 'issuer';
        const audience = process.env.JWT_AUDIENCE || 'audience';
        const token = JwtHelper.generateToken(account.id!, account.username, account.role.name, secretKey, issuer, audience);

        res.status(200).json({ token, userId: account.id, username: account.username });
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

        res.status(200).send(saveData.dataSave);
    }

    public static async saveGameData(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const { dataSave, reason } = req.body;
        const repo = ApplicationDbContext.getRepository(SaveData);

        const existing = await repo.findOne({ where: { accountId } });

        if (existing) {
            if (existing.dataSave) {
                try {
                    JSON.parse(dataSave);
                } catch {
                    res.status(400).json("Dữ liệu save bị lỗi cấu trúc.");
                    return;
                }
            }
            existing.dataSave = dataSave;
            existing.lastUpdated = new Date();
            await repo.save(existing);
        } else {
            const newSave = new SaveData();
            newSave.accountId = accountId;
            newSave.dataSave = dataSave;
            await repo.save(newSave);
        }

        res.status(200).json({ message: "Saved successfully", context: reason || "Manual" });
    }
}