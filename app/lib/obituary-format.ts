export function formatObituaryDate(value: string | null, includeTime = false) {
  if (!value) return "";
  const date = new Date(includeTime ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-BB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
}

export function lifeDates(birthDate: string | null, deathDate: string | null) {
  const birth = formatObituaryDate(birthDate);
  const death = formatObituaryDate(deathDate);
  if (birth && death) return `${birth} — ${death}`;
  if (death) return `Died ${death}`;
  if (birth) return `Born ${birth}`;
  return "";
}
