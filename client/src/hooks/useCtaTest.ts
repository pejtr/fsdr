import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";

interface CtaVariant {
  id: number;
  variantName: string;
  buttonText: string;
  buttonColor: string | null;
  subText: string | null;
}

interface UseCtaTestResult {
  variant: CtaVariant | null;
  testName: string | null;
  trackClick: () => void;
  trackConversion: () => void;
  isLoading: boolean;
}

// Persist variant assignment in sessionStorage to keep consistent experience
function getStoredVariant(location: string): number | null {
  try {
    const stored = sessionStorage.getItem(`cta_variant_${location}`);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
}

function storeVariant(location: string, variantId: number) {
  try {
    sessionStorage.setItem(`cta_variant_${location}`, String(variantId));
  } catch {
    // Ignore storage errors
  }
}

export function useCtaTest(location: string): UseCtaTestResult {
  const [storedId] = useState(() => getStoredVariant(location));
  
  const { data, isLoading } = trpc.ctaTest.getVariant.useQuery(
    { location },
    { 
      staleTime: Infinity, // Don't refetch - keep same variant for session
      refetchOnWindowFocus: false,
    }
  );

  const clickMutation = trpc.ctaTest.recordClick.useMutation();
  const conversionMutation = trpc.ctaTest.recordConversion.useMutation();

  // Store variant when we get it
  useEffect(() => {
    if (data?.variant && !storedId) {
      storeVariant(location, data.variant.id);
    }
  }, [data, location, storedId]);

  const result = useMemo(() => ({
    variant: data?.variant ?? null,
    testName: data?.testName ?? null,
    trackClick: () => {
      if (data?.variant) {
        clickMutation.mutate({ variantId: data.variant.id });
      }
    },
    trackConversion: () => {
      if (data?.variant) {
        conversionMutation.mutate({ variantId: data.variant.id });
      }
    },
    isLoading,
  }), [data, isLoading, clickMutation, conversionMutation]);

  return result;
}
