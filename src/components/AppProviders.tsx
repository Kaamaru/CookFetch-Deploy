"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { GlobalProvider } from "@/contexts/GlobalContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

type AppProvidersProps = {
  children: ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <GlobalProvider>
              <Navigation />
              <PageTransition>{children}</PageTransition>
              <Footer />
              <Toaster />
            </GlobalProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
