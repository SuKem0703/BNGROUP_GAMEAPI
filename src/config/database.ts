import { DataSource } from "typeorm";
import mysql from "mysql2/promise";
import { Account } from "../models/user/Account";
import { UserCurrency } from "../models/user/UserCurrency";
import { UserStat } from "../models/user/UserStat";
import { UserItem } from "../models/user/UserItem";
import { StorageItem } from "../models/user/StorageItem";
import { ShopLog } from "../models/user/ShopLog";
import { SaveData } from "../models/user/SaveData";
import { ForumThread } from "../models/forum/ForumThread";
import { ForumPost } from "../models/forum/ForumPost";
import { FarmPlot } from "../models/user/FarmPlot";
import { Role } from "../models/user/Role";
import { GiftCode } from "../models/giftcode/GiftCode";
import { GiftCodeReward } from "../models/giftcode/GiftCodeReward";
import { GiftCodeRedemption } from "../models/giftcode/GiftCodeRedemption";

const getDbConfig = () => {
    const type = (process.env.DB_TYPE as any) || "mysql";
    const host = process.env.DB_HOST || "localhost";
    const port = Number(process.env.DB_PORT) || 3306;
    const username = process.env.DB_USER || "root";
    const password = process.env.DB_PASSWORD || "";
    const database = process.env.DB_NAME || "ChroniclesGameDb";
    const ssl = process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined;

    return { type, host, port, username, password, database, ssl };
};

const dbConfig = getDbConfig();

export const ApplicationDbContext = new DataSource({
    ...dbConfig,
    synchronize: false,
    logging: false,
    entities: [
        Account,
        UserCurrency,
        UserStat,
        UserItem,
        StorageItem,
        ShopLog,
        SaveData,
        ForumThread,
        ForumPost,
        FarmPlot,
        Role,
        GiftCode,
        GiftCodeReward,
        GiftCodeRedemption
    ]
});

const ensureGiftCodeSchema = async () => {
    if (ApplicationDbContext.options.type !== "mysql") {
        return;
    }

    await ApplicationDbContext.query(`
        CREATE TABLE IF NOT EXISTS GiftCodes (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(80) NOT NULL,
            title VARCHAR(180) NULL,
            description TEXT NULL,
            isUnlimitedQuantity TINYINT(1) NOT NULL DEFAULT 1,
            maxRedemptions INT NULL,
            redeemedCount INT NOT NULL DEFAULT 0,
            isUnlimitedDuration TINYINT(1) NOT NULL DEFAULT 1,
            expiresAt DATETIME NULL,
            isActive TINYINT(1) NOT NULL DEFAULT 1,
            publishToForum TINYINT(1) NOT NULL DEFAULT 0,
            forumThreadId INT NULL,
            createdByAccountId VARCHAR(255) NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY UQ_GiftCodes_Code (code)
        )
    `);

    await ApplicationDbContext.query(`
        CREATE TABLE IF NOT EXISTS GiftCodeRewards (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            giftCodeId INT NOT NULL,
            itemId INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            rarity INT NOT NULL DEFAULT 1,
            qualityFactor FLOAT NOT NULL DEFAULT 1,
            KEY IDX_GiftCodeRewards_GiftCodeId (giftCodeId),
            CONSTRAINT FK_GiftCodeRewards_GiftCode
                FOREIGN KEY (giftCodeId) REFERENCES GiftCodes(id)
                ON DELETE CASCADE
        )
    `);

    await ApplicationDbContext.query(`
        CREATE TABLE IF NOT EXISTS GiftCodeRedemptions (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            giftCodeId INT NOT NULL,
            accountId VARCHAR(255) NOT NULL,
            redeemedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY UQ_GiftCodeRedemptions_GiftCode_Account (giftCodeId, accountId),
            KEY IDX_GiftCodeRedemptions_GiftCodeId (giftCodeId),
            KEY IDX_GiftCodeRedemptions_AccountId (accountId),
            CONSTRAINT FK_GiftCodeRedemptions_GiftCode
                FOREIGN KEY (giftCodeId) REFERENCES GiftCodes(id)
                ON DELETE CASCADE,
            CONSTRAINT FK_GiftCodeRedemptions_Account
                FOREIGN KEY (accountId) REFERENCES Accounts(id)
                ON DELETE CASCADE
        )
    `);
};

export const initializeDatabase = async () => {
    const config = getDbConfig();

    console.log("===== DB CONFIG =====");
    console.log(config);

    try {
        if (config.type === "mysql") {
            const connection = await mysql.createConnection({
                host: config.host,
                port: config.port,
                user: config.username,
                password: config.password,
                ssl: config.ssl || undefined
            });

            const [rows]: any = await connection.query("SHOW DATABASES");
            console.log("===== DATABASES =====");
            console.table(rows);

            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
            console.log(`DB ensured: ${config.database}`);

            await connection.end();
        }

        await ApplicationDbContext.initialize();
        await ensureGiftCodeSchema();

        console.log("===== CONNECTED DB =====");
        console.log(ApplicationDbContext.options.database);

        console.log("Database connection established successfully.");
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1);
    }
};
