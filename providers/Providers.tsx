"use client";
import React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import UsernameGate from "@/components/auth/UsernameGate";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
interface LayoutProps {
  children: React.ReactNode;
}
const Providers = ({ children }: LayoutProps) => {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <UsernameGate />
          {children}
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
};

export default Providers;
