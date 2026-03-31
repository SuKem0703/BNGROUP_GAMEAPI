import "reflect-metadata";
import 'dotenv/config';
import app from './app';
import { initializeDatabase } from './config/database';
import { SystemOptimizationService } from './services/SystemOptimizationService';
import { DatabaseSeeder } from './utils/DatabaseSeeder';

const PORT = process.env.PORT || 8080;

const startServer = async () => {
    await initializeDatabase();
    await DatabaseSeeder.runSeeds();

    const optimizationService = new SystemOptimizationService();
    optimizationService.start();

    app.listen(PORT, () => {
        console.log(`🚀 Server đang chạy tại port ${PORT}`);
    });
};

startServer();