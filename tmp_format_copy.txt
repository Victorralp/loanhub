export const formatCurrency = (
  value: number | string | null | undefined,
  currency: string = "NGN"
): string => {
  const num = typeof value === "string" ? parseFloat(value) : value ?? 0;
  if (typeof num !== "number" || isNaN(num)) return "";

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    // Fallback to manual symbol if Intl or currency unsupported
    return `₦${Number(num).toFixed(2)}`;
  }
};

