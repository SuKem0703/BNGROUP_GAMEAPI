export interface GiftCodeRewardView {
  itemId: number;
  quantity: number;
  category: string;
}

export interface GiftCodeLiveEntry {
  id: number;
  code: string;
  title: string;
  description: string | null;
  expiresAt: string | null;
  isUnlimitedDuration: boolean;
  isUnlimitedQuantity: boolean;
  maxRedemptions: number | null;
  redeemedCount: number;
  remainingCount: number | null;
  forumThreadId: number | null;
  hasRedeemed: boolean;
  rewards: GiftCodeRewardView[];
}

export interface GiftCodeRedeemResult {
  message: string;
  giftCodeId: number;
  code: string;
  title: string;
  redeemedCount: number;
  remainingCount: number | null;
  rewards: GiftCodeRewardView[];
}
