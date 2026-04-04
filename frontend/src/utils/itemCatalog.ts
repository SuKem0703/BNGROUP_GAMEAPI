const ITEM_CATEGORIES = [
  { min: 101, max: 199, label: 'Sword' },
  { min: 201, max: 299, label: 'Shield' },
  { min: 301, max: 399, label: 'Helmet' },
  { min: 401, max: 499, label: 'Armor' },
  { min: 501, max: 599, label: 'Staff' },
  { min: 601, max: 699, label: 'Spellbook / Catalyst' },
  { min: 701, max: 799, label: 'Mage Hat' },
  { min: 801, max: 899, label: 'Mage Robe' },
  { min: 901, max: 999, label: 'Ring' },
  { min: 1001, max: 1099, label: 'Amulet' },
  { min: 1101, max: 1199, label: 'Earring' },
  { min: 1201, max: 1299, label: 'Seed' },
  { min: 1301, max: 1399, label: 'Crop' },
  { min: 1401, max: 1499, label: 'Material' },
] as const;

export function getItemCategoryLabel(itemId: number) {
  const category = ITEM_CATEGORIES.find((entry) => itemId >= entry.min && itemId <= entry.max);
  return category?.label ?? 'Unknown';
}

export function isEquipmentItem(itemId: number) {
  return itemId >= 101 && itemId <= 1199;
}
