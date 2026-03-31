import { ApplicationDbContext } from '../config/database';

export class SystemOptimizationService {
    private static readonly AppUrl = "http://localhost:8080/api/gamedata/ping";
    private timer?: NodeJS.Timeout;

    public start(): void {
        console.log("🚀 System Optimization Service started.");
        
        this.timer = setInterval(async () => {
            await this.executeAsync();
        }, 10 * 60 * 1000); 
    }

    public stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    private async executeAsync(): Promise<void> {
        try {
            console.log("--- ⚡ Bắt đầu chu trình tối ưu hệ thống ---");

            const memoryUsage = process.memoryUsage();
            console.log(`🧹 [RAM Checker] Bộ nhớ đang dùng: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);

            if (ApplicationDbContext.isInitialized) {
                await ApplicationDbContext.query("SELECT 1");
                console.log("🔥 [DB Warmup] Kết nối Database: OK (Active)");
            }

            const response = await fetch(SystemOptimizationService.AppUrl, {
                method: 'GET',
                signal: AbortSignal.timeout(10000)
            });

            if (response.ok) {
                try {
                    const text = await response.text();
                    const doc = JSON.parse(text);
                    if (doc.serverTime) {
                        console.log(`✅ [Health Check] Server phản hồi tốt (Status: ${response.status}). ServerTime: ${doc.serverTime}`);
                    } else {
                        console.log(`✅ [Health Check] Server phản hồi tốt (Status: ${response.status}).`);
                    }
                } catch {
                    console.log(`✅ [Health Check] Server phản hồi tốt (Status: ${response.status}).`);
                }
            } else {
                console.warn(`⚠️ [Health Check] Server phản hồi lạ: ${response.status}`);
            }

            console.log("--- ✅ Hoàn tất tối ưu ---");
        } catch (error: any) {
            console.error(`❌ Lỗi trong quá trình tối ưu: ${error.message}`);
        }
    }
}