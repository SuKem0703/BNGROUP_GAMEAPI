import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

// Cấu hình Middleware
app.use(cors());
// Tăng limit để nhận chuỗi JSON SaveData lớn
app.use(express.json({ limit: '10mb' })); 

// Gắn toàn bộ routes
app.use('/api', routes);

// Bắt lỗi toàn cục
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

export default app;