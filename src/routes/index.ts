import { Router } from 'express';
import { GameDataController } from '../controllers/GameDataController';
import { AccountsController } from '../controllers/AccountsController';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Public routes (Không cần token)
router.post('/GameData/login', GameDataController.login);
router.get('/GameData/ping', GameDataController.ping);
router.post('/Accounts/Create', AccountsController.register);

// Protected routes (Bắt buộc có token)
// Ví dụ với GameData
router.get('/GameData/get-save', authMiddleware, GameDataController.getSaveData);
router.post('/GameData/save-data', authMiddleware, GameDataController.saveGameData);

// *Bạn có thể import và map tiếp các Controller khác (Inventory, Economy, Stats...) tại đây với authMiddleware*

export default router;