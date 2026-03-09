import { QueryClient } from '@tanstack/react-query';

/**
 * Global React Query client.
 *
 * – staleTime 5 min: data is considered "fresh" for 5 minutes,
 *   so navigating back to a page won't trigger a redundant fetch.
 * – gcTime 10 min: unused cache entries are garbage-collected after 10 min.
 * – refetchOnWindowFocus disabled: avoids surprise refetches when
 *   switching browser tabs (especially disruptive on admin pages).
 * – retry 1: light retry to recover from transient network hiccups.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 minutes
      gcTime: 10 * 60 * 1000,         // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default queryClient;
