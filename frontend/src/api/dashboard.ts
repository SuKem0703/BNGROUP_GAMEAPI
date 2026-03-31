import { apiClient } from '@/lib/axios';
import { normalizeDashboard } from '@/utils/normalize';

export async function getDashboard() {
  const response = await apiClient.get('/Accounts/Dashboard');
  return normalizeDashboard(response.data);
}
