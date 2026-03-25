"use client";
import React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
interface LayoutProps {
  children: React.ReactNode;
}
const Providers = ({ children }: LayoutProps) => {
  return (
    <AuthProvider>
      <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
        {children}
        <Toaster position="bottom-center" />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default Providers;
