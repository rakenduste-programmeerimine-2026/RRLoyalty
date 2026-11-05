const NAME_DAY_DISCOUNT = 0.1;

const euro = new Intl.NumberFormat("et-EE", { style: "currency", currency: "EUR" });

export function formatEur(amount: number): string {
  return euro.format(amount);
}

export function nameDayPrice(price: number): number {
  return Math.round(price * (1 - NAME_DAY_DISCOUNT) * 100) / 100;
}
