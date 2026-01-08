"use client"

import {
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:backdrop-blur-sm",
          description: "group-[.toast]:text-sm group-[.toast]:opacity-90",
          actionButton:
            "group-[.toast]:bg-orange-600 group-[.toast]:text-white group-[.toast]:hover:bg-orange-700 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:transition-colors",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:transition-colors",
        },
      }}
      icons={{
        success: (
          <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
        ),
        info: (
          <Info className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
        ),
        warning: (
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        ),
        error: (
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
        ),
        loading: (
          <Loader2 className="h-5 w-5 text-orange-600 dark:text-orange-400 animate-spin flex-shrink-0" />
        ),
      }}
      {...props}
    />
  )
}

export { Toaster }
