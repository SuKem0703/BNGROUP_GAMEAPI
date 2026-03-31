import type { ApiErrorShape } from '@/types/api';
import type { AuthResponse } from '@/types/auth';
import type { DashboardStats } from '@/types/dashboard';
import type { ForumReply, ForumThreadDetail, ForumThreadSummary } from '@/types/forum';

type UnknownRecord = Record<string, unknown>;

const DEFAULT_DASHBOARD: DashboardStats = {
  lvl: 1,
  exp: 0,
  potentialPoints: 0,
  str: 0,
  dex: 0,
  intStat: 0,
  con: 0,
  coin: 0,
  gem: 0,
  currentKnightHP: 100,
  currentKnightMP: 50,
  currentmageHP: 80,
  currentMageMP: 75,
  currentStamina: 100,
};

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function unwrapPayload<T = unknown>(value: unknown): T {
  if (!isRecord(value)) {
    return value as T;
  }

  const nested = value.data ?? value.result ?? value.payload;
  if (nested !== undefined) {
    return unwrapPayload<T>(nested);
  }

  return value as T;
}

function getString(source: UnknownRecord, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function getNumber(source: UnknownRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function getArray<T = unknown>(value: unknown, keys: string[] = []): T[] {
  const unwrapped = unwrapPayload(value);
  if (Array.isArray(unwrapped)) {
    return unwrapped as T[];
  }

  if (isRecord(unwrapped)) {
    for (const key of keys) {
      const candidate = unwrapped[key];
      if (Array.isArray(candidate)) {
        return candidate as T[];
      }
    }
  }

  return [];
}

function buildPreview(content: string) {
  if (content.length <= 140) {
    return content;
  }

  return `${content.slice(0, 137).trimEnd()}...`;
}

export function normalizeApiError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  if (error instanceof Error && 'status' in error) {
    return error;
  }

  const apiError = new Error(fallback) as ApiErrorShape;

  if (isRecord(error)) {
    const response = error.response;
    if (isRecord(response)) {
      apiError.status =
        typeof response.status === 'number' ? response.status : undefined;

      const data = isRecord(response.data) ? response.data : undefined;
      if (data) {
        apiError.message = getString(data, ['error', 'message', 'title'], fallback);
        apiError.raw = data;
        return apiError;
      }
    }

    apiError.message = getString(error, ['message'], fallback);
    apiError.raw = error;
    return apiError;
  }

  if (error instanceof Error) {
    apiError.message = error.message || fallback;
  }

  return apiError;
}

export function normalizeAuthResponse(
  value: unknown,
  fallbackIdentity = '',
): AuthResponse {
  const payload = unwrapPayload(value);
  const source = isRecord(payload) ? payload : {};
  const token = getString(source, ['token', 'accessToken', 'jwt']);
  const userSource = isRecord(source.user) ? source.user : source;
  const userId = getString(userSource, ['accountId', 'id', 'userId']);
  const username = getString(userSource, ['username', 'name'], fallbackIdentity);
  const email = getString(userSource, ['email'], '');

  return {
    token,
    user:
      userId || username
        ? {
            id: userId || username,
            username: username || fallbackIdentity || 'Adventurer',
            email: email || null,
          }
        : null,
    message: getString(source, ['message']),
  };
}

export function normalizeDashboard(value: unknown): DashboardStats {
  const payload = unwrapPayload(value);
  const source = isRecord(payload) ? payload : {};

  return {
    ...DEFAULT_DASHBOARD,
    lvl: getNumber(source, ['lvl', 'level'], DEFAULT_DASHBOARD.lvl),
    exp: getNumber(source, ['exp', 'experience'], DEFAULT_DASHBOARD.exp),
    potentialPoints: getNumber(
      source,
      ['potentialPoints'],
      DEFAULT_DASHBOARD.potentialPoints,
    ),
    str: getNumber(source, ['str'], DEFAULT_DASHBOARD.str),
    dex: getNumber(source, ['dex'], DEFAULT_DASHBOARD.dex),
    intStat: getNumber(source, ['intStat', 'int'], DEFAULT_DASHBOARD.intStat),
    con: getNumber(source, ['con'], DEFAULT_DASHBOARD.con),
    coin: getNumber(source, ['coin'], DEFAULT_DASHBOARD.coin),
    gem: getNumber(source, ['gem'], DEFAULT_DASHBOARD.gem),
    currentKnightHP: getNumber(
      source,
      ['currentKnightHP'],
      DEFAULT_DASHBOARD.currentKnightHP,
    ),
    currentKnightMP: getNumber(
      source,
      ['currentKnightMP'],
      DEFAULT_DASHBOARD.currentKnightMP,
    ),
    currentmageHP: getNumber(
      source,
      ['currentmageHP'],
      DEFAULT_DASHBOARD.currentmageHP,
    ),
    currentMageMP: getNumber(
      source,
      ['currentMageMP'],
      DEFAULT_DASHBOARD.currentMageMP,
    ),
    currentStamina: getNumber(
      source,
      ['currentStamina'],
      DEFAULT_DASHBOARD.currentStamina,
    ),
  };
}

function normalizeForumReply(value: unknown): ForumReply {
  const source = isRecord(value) ? value : {};

  return {
    id: getNumber(source, ['id']),
    content: getString(source, ['content', 'body'], ''),
    authorName: getString(
      source,
      ['authorName', 'author', 'username'],
      'Unknown adventurer',
    ),
    createdAt: getString(source, ['createdAt', 'created'], new Date().toISOString()),
  };
}

function normalizeForumSummary(value: unknown): ForumThreadSummary {
  const source = isRecord(value) ? value : {};
  const content = getString(source, ['content', 'body'], '');

  return {
    id: getNumber(source, ['id']),
    title: getString(source, ['title'], 'Untitled thread'),
    content,
    preview: buildPreview(content),
    authorName: getString(
      source,
      ['authorName', 'author', 'username'],
      'Unknown adventurer',
    ),
    createdAt: getString(source, ['createdAt', 'created'], new Date().toISOString()),
    viewCount: getNumber(source, ['viewCount', 'views']),
    postCount: getNumber(source, ['postCount', 'replyCount', 'postsCount']),
  };
}

export function normalizeForumThreads(value: unknown) {
  return getArray(value, ['threads', 'items', 'posts']).map(normalizeForumSummary);
}

export function normalizeForumDetail(value: unknown): ForumThreadDetail {
  const payload = unwrapPayload(value);
  const source = isRecord(payload) ? payload : {};
  const summary = normalizeForumSummary(source);

  return {
    ...summary,
    posts: getArray(source.posts ?? source.replies ?? source.comments).map(
      normalizeForumReply,
    ),
  };
}
