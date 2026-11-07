export const formatIDR = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

export const formatGroupedDigits = (digits) => {
  const text = String(digits ?? "").replace(/\D/g, "");
  if (!text) return "";
  return text.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const formatShortDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};
