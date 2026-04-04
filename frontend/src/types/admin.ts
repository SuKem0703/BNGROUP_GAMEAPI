export interface AdminSummary {
  totalUsers?: number;
  bannedUsers?: number;
  warnedUsers?: number;
  activeUsers?: number;
  totalThreads?: number;
  totalReplies?: number;
  totalGiftCodes?: number;
  activeGiftCodes?: number;
  totalShopPurchases?: number;
  totalShopRevenue?: number;
}

export interface AdminShopLog {
  id: number;
  accountId: string;
  itemId: number;
  itemName: string;
  quantity: number;
  priceAtMoment: number;
  currency: string;
  totalCost: number;
  date: string;
}

export interface AdminUserSummary {
  accountId: string;
  username: string;
  email: string;
  createdAt: string;
  status: number;
  role: string;
  level: number;
  exp: number;
  potentialPoints: number;
  coin: number;
  gem: number;
  hasSaveData: boolean;
  lastSaveAt: string | null;
}

export interface AdminUserDetail {
  account: {
    accountId: string;
    username: string;
    email: string;
    createdAt: string;
    status: number;
    role: string;
  };
  stats: Record<string, unknown> | null;
  currency: {
    coin: number;
    gem: number;
  } | null;
  saveData: {
    lastUpdated: string | null;
    raw: string | null;
    parsed: unknown;
  };
  activity: {
    inventoryCount: number;
    storageCount: number;
    farmCount: number;
    threadCount: number;
    postCount: number;
    giftCodeRedemptionCount: number;
  };
}

export interface AdminForumThreadSummary {
  id: number;
  title: string;
  content: string;
  preview: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  viewCount: number;
  postCount: number;
}

export interface AdminForumThreadDetail {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  viewCount: number;
  authorName: string;
  authorId: string;
  posts: Array<{
    id: number;
    content: string;
    createdAt: string;
    authorName: string;
    authorId: string;
  }>;
}

export interface AdminGiftCodeReward {
  itemId: number;
  quantity: number;
  rarity?: number;
  qualityFactor?: number;
  category?: string;
}

export interface AdminGiftCode {
  id: number;
  code: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
  isUnlimitedDuration: boolean;
  isUnlimitedQuantity: boolean;
  maxRedemptions: number | null;
  redeemedCount: number;
  remainingCount: number | null;
  publishToForum: boolean;
  forumThreadId: number | null;
  rewards: AdminGiftCodeReward[];
  latestRedemptions: Array<{
    accountId: string;
    redeemedAt: string;
  }>;
}

export interface CreateAdminGiftCodePayload {
  code: string;
  title?: string;
  description?: string;
  isUnlimitedQuantity: boolean;
  maxRedemptions?: number | null;
  isUnlimitedDuration: boolean;
  expiresAt?: string | null;
  publishToForum: boolean;
  rewards: AdminGiftCodeReward[];
}
