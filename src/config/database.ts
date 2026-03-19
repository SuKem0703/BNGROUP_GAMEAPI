import { DataSource } from "typeorm";
import { Account } from "../models/user/Account";
import { UserCurrency } from "../models/user/UserCurrency";
import { UserStat } from "../models/user/UserStat";
import { UserItem } from "../models/user/UserItem";
import { StorageItem } from "../models/user/StorageItem";
import { ShopLog } from "../models/user/ShopLog";
import { SaveData } from "../models/user/SaveData";
import { ForumThread } from "../models/forum/ForumThread";
import { ForumPost } from "../models/forum/ForumPost";

export const ApplicationDbContext = new DataSource({
    // Render (and many managed Postgres providers) require SSL.
    // Set DB_TYPE=postgres in your .env when using Postgres.
    type: (process.env.DB_TYPE as any) || "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "your_password",
    database: process.env.DB_NAME || "ChroniclesGameDb",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    synchronize: true,
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
        ForumPost
    ]
});

export const initializeDatabase = async () => {
    try {
        await ApplicationDbContext.initialize();
        console.log("Database connection established successfully.");
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1);
    }
};