export class AddItemRequest {
    itemId!: number;
    quantity: number = 1;
    slotIndex?: number; 
    rarity: number = 1;
    qualityFactor: number = 1;
}