import { apiClient } from '@/lib/axios';

export interface LeaderboardEntry {
  rank: number;
  username: string;
  level: number;
  exp: number;
  coin: number;
}

export async function getLeaderboard() {
  const response = await apiClient.get<LeaderboardEntry[]>('/Leaderboard');
  return response.data;
}
