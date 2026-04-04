import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

import { AdminController } from '../controllers/AdminController';
import { AccountsController } from '../controllers/AccountsController';
import { EconomyController } from '../controllers/EconomyController';
import { ForumController } from '../controllers/ForumController';
import { GameDataController } from '../controllers/GameDataController';
import { InventoryController } from '../controllers/InventoryController';
import { LeaderboardController } from '../controllers/LeaderboardController';
import { PlayerStatsController } from '../controllers/PlayerStatsController';
import { SaveDataController } from '../controllers/SaveDataController';
import { ShopController } from '../controllers/ShopController';
import { StorageController } from '../controllers/StorageController';
import { FarmController } from '../controllers/FarmController';

const router = Router();

router.get('/GameData/ping', GameDataController.ping);

router.post('/Accounts/Create', AccountsController.register);
router.post('/Accounts/Login', AccountsController.login);

router.get('/Leaderboard', LeaderboardController.getLeaderboard);

router.get('/Forum', ForumController.getThreads);
router.get('/Forum/Details/:id', ForumController.getThreadDetails);

router.get('/Admin/dashboard', adminMiddleware, AdminController.getDashboard);
router.get('/Admin/users/:accountId', adminMiddleware, AdminController.getUserDetail);
router.patch('/Admin/users/:accountId/status', adminMiddleware, AdminController.updateStatus);
router.patch('/Admin/users/:accountId/currency', adminMiddleware, AdminController.updateCurrency);

router.get('/Accounts/Dashboard', authMiddleware, AccountsController.dashboard);

router.get('/GameData/get-save', authMiddleware, GameDataController.getSaveData);
router.post('/GameData/save-data', authMiddleware, GameDataController.saveGameData);

router.get('/Economy/balance', authMiddleware, EconomyController.getBalance);
router.post('/Economy/spend', authMiddleware, EconomyController.spendCurrency);
router.post('/Economy/earn', authMiddleware, EconomyController.earnCurrency);

router.get('/Inventory/sync', authMiddleware, InventoryController.getInventory);
router.post('/Inventory/equip', authMiddleware, InventoryController.setEquipState);
router.post('/Inventory/move', authMiddleware, InventoryController.moveItem);
router.post('/Inventory/add', authMiddleware, InventoryController.addItem);
router.post('/Inventory/update-quantity', authMiddleware, InventoryController.updateQuantity);
router.post('/Inventory/remove', authMiddleware, InventoryController.removeItem);

router.get('/PlayerStats/profile', authMiddleware, PlayerStatsController.getProfile);
router.post('/PlayerStats/distribute', authMiddleware, PlayerStatsController.distributePoints);
router.post('/PlayerStats/reset', authMiddleware, PlayerStatsController.resetStats);
router.post('/PlayerStats/add-exp', authMiddleware, PlayerStatsController.addExperience);

router.post('/Shop/buy', authMiddleware, ShopController.buyItem);

router.get('/Storage/load-map-storage', authMiddleware, StorageController.getMapStorage);
router.get('/Storage/load-chest', authMiddleware, StorageController.getSingleChest);
router.post('/Storage/deposit', authMiddleware, StorageController.depositItem);
router.post('/Storage/withdraw', authMiddleware, StorageController.withdrawItem);

router.post('/Forum/Create', authMiddleware, ForumController.createThread);
router.post('/Forum/Reply', authMiddleware, ForumController.reply);

router.get('/Farm/sync', authMiddleware, FarmController.syncFarm);
router.post('/Farm/plant', authMiddleware, FarmController.plantSeed);
router.post('/Farm/harvest', authMiddleware, FarmController.harvestCrop);

router.post('/SaveData/upload', authMiddleware, SaveDataController.uploadSaveData);

export default router;
