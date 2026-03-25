import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';

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

// ==========================================
// PUBLIC ROUTES (Không yêu cầu token)
// ==========================================

// GameData & Auth
router.post('/GameData/login', GameDataController.login);
router.get('/GameData/ping', GameDataController.ping);

// Accounts
router.post('/Accounts/Create', AccountsController.register);
router.post('/Accounts/Login', AccountsController.login);

// Leaderboard
router.get('/Leaderboard', LeaderboardController.getLeaderboard);

// Forum (Xem công khai)
router.get('/Forum', ForumController.getThreads);
router.get('/Forum/Details/:id', ForumController.getThreadDetails);

// ==========================================
// PROTECTED ROUTES (Yêu cầu token)
// ==========================================

// Accounts (Dashboard)
router.get('/Accounts/Dashboard', authMiddleware, AccountsController.dashboard);

// GameData (Save/Load)
router.get('/GameData/get-save', authMiddleware, GameDataController.getSaveData);
router.post('/GameData/save-data', authMiddleware, GameDataController.saveGameData);

// Economy
router.get('/Economy/balance', authMiddleware, EconomyController.getBalance);
router.post('/Economy/spend', authMiddleware, EconomyController.spendCurrency);
router.post('/Economy/earn', authMiddleware, EconomyController.earnCurrency);

// Inventory
router.get('/Inventory/sync', authMiddleware, InventoryController.getInventory);
router.post('/Inventory/equip', authMiddleware, InventoryController.setEquipState);
router.post('/Inventory/move', authMiddleware, InventoryController.moveItem);
router.post('/Inventory/add', authMiddleware, InventoryController.addItem);
router.post('/Inventory/update-quantity', authMiddleware, InventoryController.updateQuantity);
router.post('/Inventory/remove', authMiddleware, InventoryController.removeItem);

// PlayerStats
router.get('/PlayerStats/profile', authMiddleware, PlayerStatsController.getProfile);
router.post('/PlayerStats/distribute', authMiddleware, PlayerStatsController.distributePoint);
router.post('/PlayerStats/reset', authMiddleware, PlayerStatsController.resetStats);
router.post('/PlayerStats/add-exp', authMiddleware, PlayerStatsController.addExperience);

// Shop
router.post('/Shop/buy', authMiddleware, ShopController.buyItem);

// Storage (Rương/Kho)
router.get('/Storage/load-map-storage', authMiddleware, StorageController.getMapStorage);
router.get('/Storage/load-chest', authMiddleware, StorageController.getSingleChest);
router.post('/Storage/deposit', authMiddleware, StorageController.depositItem);
router.post('/Storage/withdraw', authMiddleware, StorageController.withdrawItem);

// Forum (Thao tác đăng bài/Bình luận)
router.post('/Forum/Create', authMiddleware, ForumController.createThread);
router.post('/Forum/Reply', authMiddleware, ForumController.reply);

// Farm
router.get('/Farm/sync', authMiddleware, FarmController.syncFarm);
router.post('/Farm/plant', authMiddleware, FarmController.plantSeed);
router.post('/Farm/harvest', authMiddleware, FarmController.harvestCrop);

// SaveData Controller rác (nếu cần dùng)
router.post('/SaveData/upload', authMiddleware, SaveDataController.uploadSaveData);

export default router;