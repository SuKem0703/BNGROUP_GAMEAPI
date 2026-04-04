import { apiClient } from '@/lib/axios';
import type { ShopItem } from '@/types/shop';

export async function getShopItems(search = '') {
  const response = await apiClient.get<ShopItem[]>('/Shop/items', { params: { search } });
  return response.data;
}

export async function buyShopItem(itemId: number, quantity: number) {
  const response = await apiClient.post('/Shop/buy', { itemId, quantity });
  return response.data;
}
