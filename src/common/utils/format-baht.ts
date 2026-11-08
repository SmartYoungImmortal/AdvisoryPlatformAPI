/** "฿1,260" from integer satang, with satang shown only when there are any ("฿1,260.50"). */
export function formatBaht(satang: number): string {
  const baht = satang / 100;
  return `฿${baht.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(baht) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
