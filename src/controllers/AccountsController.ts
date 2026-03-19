import { Request, Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ApplicationDbContext } from '../config/database';
import { Account, AccountStatus } from '../models/user/Account';
import { SaveData } from '../models/user/SaveData';
import { UserStat } from '../models/user/UserStat';
import { UserCurrency } from '../models/user/UserCurrency';
import { PasswordHasher } from '../utils/PasswordHasher';
import { JwtHelper } from '../utils/JwtHelper';

export class AccountsController {
    public static async register(req: Request, res: Response): Promise<void> {
        const { username, email, password } = req.body;

        try {
            const accountRepo = ApplicationDbContext.getRepository(Account);
            const existingUser = await accountRepo.findOne({
                where: [{ username: username }, { email: email }]
            });

            if (existingUser) {
                res.status(400).json({ error: 'Tên người dùng hoặc Email đã tồn tại!' });
                return;
            }

            const now = new Date();
            const prefix = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
            let generatedId = "";

            // --- ĐỌC DỮ LIỆU FILE SAVE MẶC ĐỊNH ---
            let saveDataJson = "{}";
            try {
                const filePath = path.join(process.cwd(), 'src', 'data', 'NewGameSaveData.json');
                saveDataJson = await fs.readFile(filePath, 'utf8');
            } catch (error) {
                console.error("Không tìm thấy file NewGameSaveData.json, sử dụng JSON rỗng.");
            }

            await ApplicationDbContext.manager.transaction(async (transactionalEntityManager) => {
                let success = false;
                for (let retry = 0; retry < 5; retry++) {
                    const countToday = await transactionalEntityManager.count(Account) + 1;
                    const serial = String(countToday).padStart(4, '0');
                    generatedId = prefix + serial;

                    const checkId = await transactionalEntityManager.findOne(Account, { where: { id: generatedId } });
                    
                    if (!checkId) {
                        // Tạo Account
                        const account = new Account();
                        account.id = generatedId;
                        account.username = username;
                        account.email = email;
                        account.passwordHash = PasswordHasher.hash(password);
                        account.createdAt = now;
                        account.status = AccountStatus.None;

                        // Tạo SaveData từ file JSON
                        const saveData = new SaveData();
                        saveData.accountId = generatedId;
                        saveData.dataSave = saveDataJson;

                        // Khởi tạo Stats mặc định
                        const userStat = new UserStat();
                        userStat.accountId = generatedId;
                        userStat.level = 1;
                        userStat.exp = 0;
                        userStat.potentialPoints = 5;
                        userStat.str = 0;
                        userStat.dex = 0;
                        userStat.int = 0;
                        userStat.con = 0;
                        userStat.updatedAt = now;

                        // Khởi tạo Ví tiền mặc định
                        const userCurrency = new UserCurrency();
                        userCurrency.accountId = generatedId;
                        userCurrency.coin = 100;
                        userCurrency.gem = 10;
                        userCurrency.updatedAt = now;

                        await transactionalEntityManager.save(account);
                        await transactionalEntityManager.save(saveData);
                        await transactionalEntityManager.save(userStat);
                        await transactionalEntityManager.save(userCurrency);

                        success = true;
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 10));
                }

                if (!success) throw new Error("Server quá tải, không thể tạo ID.");
            });

            res.status(201).json({ message: "Đăng ký thành công", accountId: generatedId });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    public static async login(req: Request, res: Response): Promise<void> {
        const { username, password } = req.body;

        try {
            const accountRepo = ApplicationDbContext.getRepository(Account);
            const account = await accountRepo.findOne({ where: { username } });

            if (!account || !PasswordHasher.verify(password, account.passwordHash)) {
                res.status(401).json({ error: 'Sai thông tin đăng nhập!' });
                return;
            }

            if (account.status === AccountStatus.Ban) {
                res.status(403).json({ error: 'Tài khoản này đã bị cấm!' });
                return;
            }

            // Thay vì dùng CookieAuth như .NET, ta dùng JWT cho API
            const token = JwtHelper.generateToken(account.id!, account.username, process.env.JWT_SECRET || 'your_super_secret_key_needs_to_be_long', 'your_issuer', 'your_audience');

            res.status(200).json({ token, accountId: account.id, username: account.username });
        } catch (error: any) {
            res.status(500).json({ error: "Lỗi server" });
        }
    }

    public static async dashboard(req: Request, res: Response): Promise<void> {
        // ID người dùng sẽ được trích xuất từ JWT token (sẽ được xử lý ở Middleware)
        const userId = (req as any).user.accountId;

        try {
            const userStat = await ApplicationDbContext.getRepository(UserStat).findOne({ where: { accountId: userId } });
            const userCurrency = await ApplicationDbContext.getRepository(UserCurrency).findOne({ where: { accountId: userId } });
            
            const statsVM: any = {};
            
            if (userStat) {
                statsVM.lvl = userStat.level;
                statsVM.exp = userStat.exp;
                statsVM.potentialPoints = userStat.potentialPoints;
                statsVM.str = userStat.str;
                statsVM.dex = userStat.dex;
                statsVM.intStat = userStat.int;
                statsVM.con = userStat.con;
            } else {
                statsVM.lvl = 1; statsVM.str = 5; statsVM.dex = 5; statsVM.intStat = 5; statsVM.con = 5;
            }

            statsVM.coin = userCurrency?.coin ?? 0;
            statsVM.gem = userCurrency?.gem ?? 0;

            const maxHP = 100 + (statsVM.con * 20) + (statsVM.lvl * 10);
            const maxMP = 50 + (statsVM.intStat * 10) + (statsVM.lvl * 5);

            statsVM.currentKnightHP = maxHP;
            statsVM.currentKnightMP = maxMP;
            statsVM.currentmageHP = Math.floor(maxHP * 0.8);
            statsVM.currentMageMP = Math.floor(maxMP * 1.5);
            statsVM.currentStamina = 100 + (statsVM.con * 2);

            res.status(200).json(statsVM);
        } catch (error: any) {
             res.status(500).json({ error: "Lỗi khi lấy dữ liệu" });
        }
    }
}