import { apiClient } from '@/lib/axios';
import type { CreateReplyPayload, CreateThreadPayload } from '@/types/forum';
import {
  normalizeForumDetail,
  normalizeForumThreads,
  unwrapPayload,
} from '@/utils/normalize';

export async function getForumThreads() {
  const response = await apiClient.get('/Forum');
  return normalizeForumThreads(response.data);
}

export async function getForumThread(id: string) {
  const response = await apiClient.get(`/Forum/Details/${id}`);
  return normalizeForumDetail(response.data);
}

export async function createForumThread(payload: CreateThreadPayload) {
  const response = await apiClient.post('/Forum/Create', payload);
  const data = unwrapPayload<Record<string, unknown>>(response.data);

  return {
    id: typeof data.threadId === 'number' ? data.threadId : null,
    message:
      typeof data.message === 'string'
        ? data.message
        : 'Thread created successfully.',
  };
}

export async function createForumReply(payload: CreateReplyPayload) {
  const response = await apiClient.post('/Forum/Reply', payload);
  const data = unwrapPayload<Record<string, unknown>>(response.data);

  return {
    message:
      typeof data.message === 'string'
        ? data.message
        : 'Reply posted successfully.',
  };
}
