import { apiClient } from '@/lib/axios';
import type { GiftCodeLiveEntry, GiftCodeRedeemResult } from '@/types/giftcode';
import { unwrapPayload } from '@/utils/normalize';

export async function getLiveGiftCodes() {
  const response = await apiClient.get('/GiftCodes/live');
  return unwrapPayload<GiftCodeLiveEntry[]>(response.data);
}

export async function redeemGiftCode(code: string) {
  const response = await apiClient.post('/GiftCodes/redeem', { code });
  return unwrapPayload<GiftCodeRedeemResult>(response.data);
}
