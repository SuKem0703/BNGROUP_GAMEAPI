type ItemCategory = {
    label: string;
    min: number;
    max: number;
    stackable: boolean;
    equipment: boolean;
};

const ITEM_CATEGORIES: ItemCategory[] = [
    { min: 101, max: 199, label: 'Sword', stackable: false, equipment: true },
    { min: 201, max: 299, label: 'Shield', stackable: false, equipment: true },
    { min: 301, max: 399, label: 'Helmet', stackable: false, equipment: true },
    { min: 401, max: 499, label: 'Armor', stackable: false, equipment: true },
    { min: 501, max: 599, label: 'Staff', stackable: false, equipment: true },
    { min: 601, max: 699, label: 'Spellbook/Catalyst', stackable: false, equipment: true },
    { min: 701, max: 799, label: 'Mage Hat', stackable: false, equipment: true },
    { min: 801, max: 899, label: 'Mage Robe', stackable: false, equipment: true },
    { min: 901, max: 999, label: 'Ring', stackable: false, equipment: true },
    { min: 1001, max: 1099, label: 'Amulet', stackable: false, equipment: true },
    { min: 1101, max: 1199, label: 'Earring', stackable: false, equipment: true },
    { min: 1201, max: 1299, label: 'Seed', stackable: true, equipment: false },
    { min: 1301, max: 1399, label: 'Crop', stackable: true, equipment: false },
    { min: 1401, max: 1499, label: 'Material', stackable: true, equipment: false }
];

export function getItemCategory(itemId: number): ItemCategory | null {
    return ITEM_CATEGORIES.find(category => itemId >= category.min && itemId <= category.max) || null;
}

export function isEquipmentItem(itemId: number): boolean {
    return getItemCategory(itemId)?.equipment ?? false;
}

export function isStackableItem(itemId: number): boolean {
    return getItemCategory(itemId)?.stackable ?? false;
}

export function getItemCategoryLabel(itemId: number): string {
    return getItemCategory(itemId)?.label || 'Unknown Resource';
}
