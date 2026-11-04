// Formatting shared by every staff screen, so money and dates look the same
// in a table cell, a card and a dialog.
export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const money = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === ""
    ? "—"
    : currency.format(Number(value));

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const shortDate = (value: string | Date | null | undefined) =>
  value ? dateFmt.format(new Date(value)) : "—";

export const shortDateTime = (value: string | Date | null | undefined) =>
  value ? dateTimeFmt.format(new Date(value)) : "—";

// An ISO timestamp as a datetime-local input wants it, in local time.
export const toLocalInput = (value: string | Date | null | undefined) => {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// SHIPPED or PENDING VERIFICATION, as a person would write it.
export const humanize = (value: string | null | undefined) =>
  value ? value.toLowerCase().replace(/[_ ]+/g, " ") : "—";

// Midnight `days` ago, for "last 30 days" style windows. Call it from a
// dynamic route only: a prerender would freeze the answer.
export const daysAgo = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
};
