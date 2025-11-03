"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./client";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Wraps the application with React Query state management.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
