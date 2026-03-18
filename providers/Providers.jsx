"use client";
import React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

const Providers = ({ children }) => {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      {children}
      <Toaster position="bottom-center" />
    </ThemeProvider>
  );
};

export default Providers;
