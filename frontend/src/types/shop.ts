export interface ShopItem {
  id: number;
  name: string;
  description: string | null;
  itemType: string;
  isStackable: boolean;
  rarity: number;
  buyPrice: number;
  sellPrice: number;
  currency: string;
  imageUrl?: string | null;
}
