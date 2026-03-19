export class StorageItem {
    id!: number;
    accountId!: string;
    chestId!: string;
    itemId!: number;
    slotIndex!: number;
    quantity!: number;
    rarity!: number;
    qualityFactor!: number;
    depositedAt: Date = new Date();
}