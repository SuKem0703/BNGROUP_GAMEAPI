import { Account } from './Account';

export class UserItem {
    id!: number;
    accountId!: string;
    account?: Account;
    itemId!: number;
    quantity: number = 1;
    slotIndex!: number;
    isEquipped: boolean = false;
    rarity!: number;
    qualityFactor!: number;
    chestId?: string;
    createdAt: Date = new Date();
}