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

        console.log("===== CONNECTED DB =====");
        console.log(ApplicationDbContext.options.database);

        console.log("Database connection established successfully.");
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1);
    }
};