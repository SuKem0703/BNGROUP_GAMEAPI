export interface ApiErrorShape extends Error {
  status?: number;
  raw?: unknown;
}
