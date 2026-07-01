"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const montado = useRef(false);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const salvo = localStorage.getItem("lavajato-theme");
    return salvo ? salvo === "dark" : true;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    montado.current = true;
  }, [dark]);

  const alternar = useCallback(() => {
    setDark((prev) => {
      const novo = !prev;
      localStorage.setItem("lavajato-theme", novo ? "dark" : "light");
      return novo;
    });
  }, []);

  return (
    <button
      onClick={alternar}
      className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={dark ? "Modo claro" : "Modo escuro"}
    >
      {dark ? (
        <Sun className="size-5 text-amber-400" />
      ) : (
        <Moon className="size-5 text-gray-600" />
      )}
    </button>
  );
}
