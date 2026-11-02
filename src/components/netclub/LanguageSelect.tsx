import { useQueryClient } from "@tanstack/react-query";
import { useI18n, LANGUAGES } from "@/i18n";
import { useRepository } from "@/data/provider";
import type { Language } from "@/data/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSelect({ className }: { className?: string }) {
  const { language, setLanguage, t } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();

  function change(next: string) {
    const value = next as Language;
    setLanguage(value);
    // A preferência também é salva no perfil quando há sessão ativa.
    repository
      .setLanguage(value)
      .then(() => queryClient.invalidateQueries({ queryKey: ["settings"] }))
      .catch(() => undefined);
  }

  return (
    <Select value={language} onValueChange={change}>
      <SelectTrigger className={className ?? "w-full"} aria-label={t("settings.language")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
