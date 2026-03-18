"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { FiMoon, FiSun } from "react-icons/fi";

const ThemeSwitcher = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const isDark = isClient && resolvedTheme === "dark";

  const handleThemeChange = (checked) => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    setTheme(checked ? "dark" : "light");

    window.setTimeout(() => {
      root.classList.remove("theme-switching");
    }, 180);
  };

  return (
    <label className="relative inline-flex h-8 w-16 cursor-pointer items-center">
      <input
        className="peer sr-only"
        type="checkbox"
        checked={isDark}
        onChange={(e) => handleThemeChange(e.target.checked)}
        aria-label="Toggle theme"
      />

      <div className="flex h-full w-full items-center justify-between rounded-full border border-base-300 bg-base-200 px-2 text-base-content/60 transition-colors duration-200 ease-out peer-checked:bg-base-300">
        <FiSun className="size-3.5" />
        <FiMoon className="size-3.5" />
      </div>

      <div className="absolute left-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-content shadow-md transition-transform duration-200 ease-out peer-checked:translate-x-8">
        {isDark ? <FiMoon className="size-3.5" /> : <FiSun className="size-3.5" />}
      </div>
    </label>
  );
};

export default ThemeSwitcher;
