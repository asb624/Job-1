import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T>(
  urlOrMethod: string,
  optionsOrUrl?: RequestInit | string,
  data?: unknown | undefined,
): Promise<T> {
  let url: string;
  let options: RequestInit;

  // Handle both calling conventions:
  // 1. apiRequest(url, options)
  // 2. apiRequest(method, url, data)
  if (typeof optionsOrUrl === 'string') {
    // Using method, url, data signature
    url = optionsOrUrl;
    options = {
      method: urlOrMethod,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    };
  } else {
    // Using url, options signature
    url = urlOrMethod;
    options = {
      ...optionsOrUrl,
      credentials: "include",
    };
  }

  const res = await fetch(url, options);

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
