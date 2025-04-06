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
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        // Add cache-busting headers
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    };
  } else {
    // Using url, options signature
    url = urlOrMethod;
    options = {
      ...optionsOrUrl,
      credentials: "include",
      headers: {
        ...(optionsOrUrl?.headers || {}),
        // Add cache-busting headers
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
    };
  }

  console.log(`API Request to ${url} with method ${options.method || 'GET'}`);
  
  try {
    const res = await fetch(url, options);
    console.log(`API Response from ${url}: ${res.status}`);
    
    await throwIfResNotOk(res);
    const data = await res.json();
    console.log(`Successfully processed response from ${url}`);
    return data;
  } catch (error) {
    console.error(`Error in apiRequest to ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`Fetching data for queryKey: ${queryKey[0]}`);
    
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers: {
          // Add a cache-busting parameter to avoid browser caching
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
      });
      
      console.log(`Response status for ${queryKey[0]}: ${res.status}`);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Returning null for unauthorized request to ${queryKey[0]}`);
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      console.log(`Successfully fetched data for ${queryKey[0]}`);
      return data;
    } catch (error) {
      console.error(`Error fetching ${queryKey[0]}:`, error);
      throw error;
    }
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
