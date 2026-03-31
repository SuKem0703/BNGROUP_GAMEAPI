import { ApplicationDbContext } from '../config/database';
import { Role, RoleType } from '../models/user/Role';
import { Account, AccountStatus } from '../models/user/Account';
import { SaveData } from '../models/user/SaveData';
import { UserStat } from '../models/user/UserStat';
import { UserCurrency } from '../models/user/UserCurrency';
import { PasswordHasher } from '../utils/PasswordHasher';
import * as fs from 'fs/promises';
import * as path from 'path';

export class DatabaseSeeder {
    public static async seedRoles(): Promise<void> {
        const roleRepo = ApplicationDbContext.getRepository(Role);

        const roles = [
            { name: RoleType.Admin, description: 'Administrator with full access' },
            { name: RoleType.Contributor, description: 'Contributor with limited admin access' },
            { name: RoleType.Player, description: 'Regular player' }
        ];

        for (const roleData of roles) {
            const existingRole = await roleRepo.findOne({ where: { name: roleData.name } });
            if (!existingRole) {
                const role = new Role();
                role.name = roleData.name;
                role.description = roleData.description;
                await roleRepo.save(role);
                console.log(`Role ${roleData.name} created.`);
            }
        }
    }

    public static async seedAdminAccount(): Promise<void> {
        const accountRepo = ApplicationDbContext.getRepository(Account);
        const roleRepo = ApplicationDbContext.getRepository(Role);

        const adminRole = await roleRepo.findOne({ where: { name: RoleType.Admin } });
        if (!adminRole) {
            throw new Error('Admin role not found. Please run seedRoles first.');
        }

        const existingAdmin = await accountRepo.findOne({ where: { username: 'admin' } });
        if (existingAdmin) {
            console.log('Admin account already exists.');
            return;
        }

        // Đọc dữ liệu save mặc định
        let saveDataJson = "{}";
        try {
            const filePath = path.join(process.cwd(), 'src', 'data', 'NewGameSaveData.json');
            saveDataJson = await fs.readFile(filePath, 'utf8');
        } catch (error) {
            console.error("Không tìm thấy file NewGameSaveData.json, sử dụng JSON rỗng.");
        }

        const now = new Date();
        const adminId = 'ADMIN001'; // ID cố định cho admin

        await ApplicationDbContext.manager.transaction(async (transactionalEntityManager) => {
            // Tạo Account admin
            const account = new Account();
            account.id = adminId;
            account.username = 'admin';
            account.email = 'admin@example.com';
            account.passwordHash = PasswordHasher.hash('1');
            account.createdAt = now;
            account.status = AccountStatus.None;
            account.role = adminRole;
            account.roleId = adminRole.id;

            // Tạo SaveData
            const saveData = new SaveData();
            saveData.accountId = adminId;
            saveData.dataSave = saveDataJson;

            // Khởi tạo Stats
            const userStat = new UserStat();
            userStat.accountId = adminId;
            userStat.level = 1;
            userStat.exp = 0;
            userStat.potentialPoints = 5;
            userStat.str = 0;
            userStat.dex = 0;
            userStat.int = 0;
            userStat.con = 0;
            userStat.updatedAt = now;

            // Khởi tạo Currency
            const userCurrency = new UserCurrency();
            userCurrency.accountId = adminId;
            userCurrency.coin = 100;
            userCurrency.gem = 10;
            userCurrency.updatedAt = now;

            await transactionalEntityManager.save(account);
            await transactionalEntityManager.save(saveData);
            await transactionalEntityManager.save(userStat);
            await transactionalEntityManager.save(userCurrency);
        });

        console.log('Admin account created with username: admin, password: 1');
    }

    public static async runSeeds(): Promise<void> {
        try {
            await this.seedRoles();
            await this.seedAdminAccount();
            console.log('Database seeding completed.');
        } catch (error) {
            console.error('Error during database seeding:', error);
        }
    }
}