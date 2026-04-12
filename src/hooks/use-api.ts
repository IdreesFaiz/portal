"use client";

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiRequest, type ApiClientOptions } from "@/lib/api-client";

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
> & {
  /** Extra fetch options (headers, cache, etc.). Method is always GET. */
  request?: Omit<ApiClientOptions, "method" | "body" | "json">;
};

/**
 * GET (or any method via `request`) with a stable `queryKey` and shared fetch logic.
 */
export function useApiQuery<TData>(
  queryKey: readonly unknown[],
  endpoint: string,
  options?: QueryOptions<TData>
) {
  const { request, ...queryOptions } = options ?? {};
  return useQuery<TData, Error>({
    ...queryOptions,
    queryKey,
    queryFn: () =>
      apiRequest<TData>(endpoint, {
        ...request,
        method: "GET",
      }),
  });
}

type MutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables>,
  "mutationFn"
> & {
  method?: ApiClientOptions["method"];
};

/**
 * POST / PUT / PATCH / DELETE with JSON body (`variables`); uses the same `apiRequest` rules.
 */
export function useApiMutation<TData, TVariables = void>(
  endpoint: string,
  options?: MutationOptions<TData, TVariables>
) {
  const { method = "POST", ...mutationOptions } = options ?? {};
  return useMutation<TData, Error, TVariables>({
    ...mutationOptions,
    mutationFn: (variables) =>
      apiRequest<TData>(endpoint, {
        method,
        ...(variables != null ? { json: variables } : {}),
      }),
  });
}
