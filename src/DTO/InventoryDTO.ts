export interface AddItemRequestDTO {
    itemId: number;
    quantity: number;
    slotIndex?: number;
    rarity?: number;
    qualityFactor?: number;
    validationSeed?: number;
    isStackable: boolean;
}

export interface UpdateQuantityRequestDTO {
    itemDbId: number;
    newQuantity: number;
}

export interface MoveItemRequestDTO {
    itemDbId: number;
    newSlotIndex: number;
    isStackable: boolean;
}

export interface EquipItemRequestDTO {
    itemDbId: number;
    isEquipped: boolean;
}

export interface RemoveItemRequestDTO {
    itemDbId: number;
}