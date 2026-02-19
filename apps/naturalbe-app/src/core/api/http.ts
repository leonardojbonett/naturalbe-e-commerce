import { appEnv } from "../config/env";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function http<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown; headers?: HeadersInit } = {}
): Promise<T> {
  const url = /^https?:\/\//i.test(path) ? path : `${appEnv.apiBaseUrl}${path}`;
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} en ${path}`);
  }

  return (await response.json()) as T;
}
