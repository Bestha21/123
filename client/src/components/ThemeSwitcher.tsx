import { Palette, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/themeContext";

interface ThemeSwitcherProps {
  variant?: "icon" | "button";
}

export function ThemeSwitcher({ variant = "icon" }: ThemeSwitcherProps) {
  const { theme, setTheme, themes, currentTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="button-theme-switcher"
          title={`Current theme: ${currentTheme.name}`}
          className={
            variant === "icon"
              ? "flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-primary"
              : "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm text-slate-700"
          }
        >
          <Palette className="w-4 h-4" />
          {variant === "button" && <span>Theme</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            data-testid={`theme-option-${t.id}`}
            className="flex items-center gap-3 cursor-pointer py-2"
          >
            <span
              className="w-5 h-5 rounded-full border border-slate-200 flex-shrink-0"
              style={{ backgroundColor: t.swatch }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{t.name}</div>
              <div className="text-xs text-slate-500 truncate">{t.description}</div>
            </div>
            {theme === t.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}