/** Formateur de prix en euros, mémoïsé au niveau module (Intl est coûteux). */
const priceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}
