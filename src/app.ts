import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec, swaggerUiOptions } from './swagger';

const app = express();
const adminPath = path.join(process.cwd(), 'public', 'admin');
const frontendPath = path.join(process.cwd(), 'public', 'app');
const mediaPath = path.join(process.cwd(), 'public', 'media');
const frontendIndexPath = path.join(frontendPath, 'index.html');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/admin-panel', express.static(adminPath));
app.use('/media', express.static(mediaPath));
app.use('/api', routes);
app.use(express.static(frontendPath));

app.get(/^\/(?!api|admin-panel).*/, (req, res, next) => {
    if (!fs.existsSync(frontendIndexPath)) {
        next();
        return;
    }

    res.sendFile(frontendIndexPath);
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
