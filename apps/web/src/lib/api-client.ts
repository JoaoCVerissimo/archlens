import type { ApiResponse } from "@archlens/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "archlens-dev-key";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
      ...options?.headers,
    },
  });

  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new Error(json.error?.message ?? `Request failed: ${res.status}`);
  }

  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// SWR fetcher
export const fetcher = async <T>(path: string): Promise<T> => {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: { "X-API-Key": API_KEY },
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.error?.message ?? "Fetch failed");
  return json.data as T;
};
