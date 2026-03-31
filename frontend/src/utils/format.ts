import dayjs from 'dayjs';

export function formatDateTime(value?: string | null, fallback = 'Unknown time') {
  if (!value) {
    return fallback;
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm') : fallback;
}

export function formatShortDateTime(
  value?: string | null,
  fallback = 'Unknown time',
) {
  if (!value) {
    return fallback;
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('HH:mm DD/MM') : fallback;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}
