const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface FetchJsonOptions extends Omit<RequestInit, "body"> {
  method?: HttpMethod;
  body?: unknown;
}

export async function fetchJson<TResponse>(
  path: string,
  options: FetchJsonOptions = {},
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const init: RequestInit = {
    ...options,
    method: options.method ?? "POST",
    credentials: "include",
    headers,
    body:
      options.body !== undefined && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : (options.body as BodyInit | null | undefined),
  };

  const res = await fetch(url, init);

  const contentType = res.headers.get("Content-Type") ?? "";
  const isJson = contentType.includes("application/json");

  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      typeof data === "string"
        ? data || res.statusText
        : data?.message ?? res.statusText;
    throw new Error(message);
  }

  return data as TResponse;
}

/** Upload multipart/form-data (ex. avatar). Ne pas set Content-Type pour laisser le navigateur ajouter la boundary. */
export async function fetchFormData<TResponse>(
  path: string,
  body: FormData,
  method: "POST" | "PUT" | "PATCH" = "POST",
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    credentials: "include",
    body,
  });

  const contentType = res.headers.get("Content-Type") ?? "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      typeof data === "string"
        ? data || res.statusText
        : (data as { message?: string })?.message ?? res.statusText;
    throw new Error(message);
  }

  return data as TResponse;
}

