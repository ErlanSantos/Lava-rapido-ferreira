"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"
import { useEffect, useState } from "react"

/** Detecta o tema atual sem depender de next-themes ThemeProvider */
function useDetectedTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")

  useEffect(() => {
    // Verifica preferência salva manualmente pelo ThemeToggle (localStorage)
    const saved = localStorage.getItem("lavajato-theme")
    if (saved === "dark" || saved === "light") {
      setTheme(saved)
      return
    }
    // Verifica classe no <html> element
    if (document.documentElement.classList.contains("dark")) {
      setTheme("dark")
      return
    }
    // Verifica preferência do sistema
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
    } else {
      setTheme("light")
    }
  }, [])

  return theme
}

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useDetectedTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
