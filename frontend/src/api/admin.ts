import { apiClient } from '@/lib/axios';
import type { ShopItem } from '@/types/shop';
import type {
  AdminForumThreadSummary,
  AdminForumThreadDetail,
  AdminGiftCode,
  AdminShopLog,
  AdminSummary,
  AdminUserDetail,
  AdminUserSummary,
  CreateAdminGiftCodePayload,
} from '@/types/admin';

export async function getAdminDashboard(search = '') {
  const response = await apiClient.get<{ summary: AdminSummary; users: AdminUserSummary[] }>(
    '/Admin/dashboard',
    { params: { search } },
  );
  return response.data;
}

export async function getAdminUserDetail(accountId: string) {
  const response = await apiClient.get<AdminUserDetail>(`/Admin/users/${accountId}`);
  return response.data;
}

export async function updateAdminUserStatus(accountId: string, status: number) {
  const response = await apiClient.patch(`/Admin/users/${accountId}/status`, { status });
  return response.data;
}

export async function updateAdminUserRole(accountId: string, role: string) {
  const response = await apiClient.patch(`/Admin/users/${accountId}/role`, { role });
  return response.data;
}

export async function updateAdminUserCurrency(accountId: string, coin: number, gem: number) {
  const response = await apiClient.patch(`/Admin/users/${accountId}/currency`, { coin, gem });
  return response.data;
}

export async function getAdminForumDashboard(search = '') {
  const response = await apiClient.get<{
    summary: AdminSummary;
    threads: AdminForumThreadSummary[];
  }>('/Admin/forum', { params: { search } });
  return response.data;
}

export async function getAdminForumThreadDetail(threadId: number) {
  const response = await apiClient.get<AdminForumThreadDetail>(`/Admin/forum/threads/${threadId}`);
  return response.data;
}

export async function deleteAdminForumThread(threadId: number) {
  const response = await apiClient.delete(`/Admin/forum/threads/${threadId}`);
  return response.data;
}

export async function deleteAdminForumPost(postId: number) {
  const response = await apiClient.delete(`/Admin/forum/posts/${postId}`);
  return response.data;
}

export async function getAdminGiftCodes(search = '') {
  const response = await apiClient.get<{ summary: AdminSummary; giftCodes: AdminGiftCode[] }>(
    '/Admin/giftcodes',
    { params: { search } },
  );
  return response.data;
}

export async function getAdminShopLogs(search = '') {
  const response = await apiClient.get<{ summary: AdminSummary; logs: AdminShopLog[] }>(
    '/Admin/shoplogs',
    { params: { search } },
  );
  return response.data;
}

export async function getAdminShopItems(search = '') {
  const response = await apiClient.get<ShopItem[]>('/Admin/shop-items', { params: { search } });
  return response.data;
}

export async function createAdminShopItem(payload: {
  id: number;
  name: string;
  description?: string | null;
  itemType: string;
  isStackable: boolean;
  rarity: number;
  buyPrice: number;
  sellPrice: number;
  currency: string;
  imageUrl?: string | null;
}) {
  const response = await apiClient.post('/Admin/shop-items', payload);
  return response.data;
}

export async function updateAdminShopItem(itemId: number, payload: {
  name?: string;
  description?: string | null;
  itemType?: string;
  isStackable?: boolean;
  rarity?: number;
  buyPrice?: number;
  sellPrice?: number;
  currency?: string;
  imageUrl?: string | null;
}) {
  const response = await apiClient.patch(`/Admin/shop-items/${itemId}`, payload);
  return response.data;
}

export async function deleteAdminShopItem(itemId: number) {
  const response = await apiClient.delete(`/Admin/shop-items/${itemId}`);
  return response.data;
}

export async function uploadAdminShopItemImage(itemId: number, payload: { imageBase64: string; filename?: string }) {
  const response = await apiClient.post(`/Admin/shop-items/${itemId}/image`, payload);
  return response.data;
}

export async function createAdminGiftCode(payload: CreateAdminGiftCodePayload) {
  const response = await apiClient.post('/Admin/giftcodes', payload);
  return response.data;
}

export async function updateAdminGiftCodeState(giftCodeId: number, isActive: boolean) {
  const response = await apiClient.patch(`/Admin/giftcodes/${giftCodeId}/state`, { isActive });
  return response.data;
}

export async function deleteAdminGiftCode(giftCodeId: number) {
  const response = await apiClient.delete(`/Admin/giftcodes/${giftCodeId}`);
  return response.data;
}
