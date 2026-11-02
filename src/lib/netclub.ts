/**
 * Utilitários puros de apresentação.
 *
 * Acesso a dados vive em `src/data` — este arquivo não faz requisições.
 */

export function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function formatCount(value: number, locale = "pt-BR") {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

/** Usado apenas onde não há acesso ao provider de i18n. */
export function timeAgo(iso: string) {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  const seconds = Math.max(0, (Date.now() - ms) / 1000);
  if (seconds < 60) return "agora";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`;
  return `${Math.floor(seconds / 86400)} d`;
}

export type ConnectionStatus = "none" | "sent" | "received" | "connected";

/** Normaliza a relação entre dois membros para a UI. */
export function connectionState(
  meId: string,
  otherId: string,
  connections: { id: string; requesterId: string; addresseeId: string; status: string }[],
): { status: ConnectionStatus; connectionId: string | null } {
  const row = connections.find(
    (c) =>
      (c.requesterId === meId && c.addresseeId === otherId) ||
      (c.requesterId === otherId && c.addresseeId === meId),
  );
  if (!row) return { status: "none", connectionId: null };
  if (row.status === "accepted") return { status: "connected", connectionId: row.id };
  return {
    status: row.requesterId === meId ? "sent" : "received",
    connectionId: row.id,
  };
}
