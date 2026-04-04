export interface ShopItem {
  id: number;
  name: string;
  description: string | null;
  itemType: string;
  isStackable: boolean;
  buyPrice: number;
  currency: string;
}
