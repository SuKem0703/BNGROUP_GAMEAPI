import 'dotenv/config';
import app from './app';
import { initializeDatabase } from './config/database';
import { SystemOptimizationService } from './services/SystemOptimizationService';

const PORT = process.env.PORT || 8080;

const startServer = async () => {
    // 1. Khởi tạo Database
    await initializeDatabase();

    // 2. Khởi động Background Service (như HostedService trong .NET)
    const optimizationService = new SystemOptimizationService();
    optimizationService.start();

    // 3. Chạy Server
    app.listen(PORT, () => {
        console.log(`🚀 Server đang chạy tại port ${PORT}`);
    });
};

startServer();