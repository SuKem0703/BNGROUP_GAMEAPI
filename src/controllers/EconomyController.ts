import { Request, Response } from 'express';
import { ApplicationDbContext } from '../config/database';
import { UserCurrency } from '../models/user/UserCurrency';
import { SaveData } from '../models/user/SaveData';
import { TimeHelper } from '../utils/TimeHelper';

export class EconomyController {
    private static async getOrCreateWallet(accountId: string): Promise<UserCurrency> {
        const repo = ApplicationDbContext.getRepository(UserCurrency);
        let wallet = await repo.findOne({ where: { accountId } });

        if (!wallet) {
            let oldCoin = 0;
            let oldGem = 0;

            const oldSave = await ApplicationDbContext.getRepository(SaveData).findOne({ where: { accountId } });
            if (oldSave && oldSave.dataSave) {
                try {
                    const stats = JSON.parse(oldSave.dataSave);
                    if (stats) {
                        oldCoin = stats.coin || 0;
                        oldGem = stats.gem || 0;
                    }
                } catch { }
            }

            wallet = new UserCurrency();
            wallet.accountId = accountId;
            wallet.coin = oldCoin;
            wallet.gem = oldGem;
            wallet.updatedAt = TimeHelper.getVietnamTime();

            await repo.save(wallet);
        }
        return wallet;
    }

    public static async getBalance(req: Request, res: Response): Promise<void> {
        const accountId = (req as any).user.accountId;
        const wallet = await EconomyController.getOrCreateWallet(accountId);
        res.status(200).json({ coin: wallet.coin, gem: wallet.gem });
    }

    public static async spendCurrency(req: Request, res: Response): Promise<void> {
        const { currencyType, amount } = req.body;
        if (amount <= 0) {
            res.status(400).json("Số tiền không hợp lệ.");
            return;
        }

        const accountId = (req as any).user.accountId;

        try {
            await ApplicationDbContext.manager.transaction(async (manager) => {
                const wallet = await EconomyController.getOrCreateWallet(accountId);
                let success = false;
                const type = currencyType.toLowerCase();

                if (type === "coin" && wallet.coin >= amount) {
                    wallet.coin -= amount;
                    success = true;
                } else if (type === "gem" && wallet.gem >= amount) {
                    wallet.gem -= amount;
                    success = true;
                }

                if (!success) {
                    res.status(200).json({ success: false, newBalance: type === "coin" ? wallet.coin : wallet.gem, message: "Không đủ tiền." });
                    return;
                }

                wallet.updatedAt = TimeHelper.getVietnamTime();
                await manager.save(wallet);

                res.status(200).json({ success: true, newBalance: type === "coin" ? wallet.coin : wallet.gem, message: "Thành công." });
            });
        } catch {
            res.status(400).json("Lỗi giao dịch.");
        }
    }

    public static async earnCurrency(req: Request, res: Response): Promise<void> {
        const { currencyType, amount } = req.body;
        if (amount <= 0) {
            res.status(400).json("Số tiền không hợp lệ.");
            return;
        }

        const accountId = (req as any).user.accountId;
        const wallet = await EconomyController.getOrCreateWallet(accountId);

        if (currencyType.toLowerCase() === "coin") wallet.coin += amount;
        else wallet.gem += amount;

        wallet.updatedAt = TimeHelper.getVietnamTime();
        await ApplicationDbContext.getRepository(UserCurrency).save(wallet);

        res.status(200).json({ success: true, newBalance: currencyType.toLowerCase() === "coin" ? wallet.coin : wallet.gem, message: "Nhận thành công." });
    }
}