import type { BeerTypes } from './types';

export async function loadBeerTypes(fault = ''): Promise<BeerTypes> {
  const response = await fetch(`/api/beer-types?fault=${encodeURIComponent(fault)}`);
  if (!response.ok) throw new Error('Kunne ikke hente øltypene.');
  return response.json();
}

export async function resetDatabase() {
  const response = await fetch('/api/debug/reset', { method: 'POST' });
  if (!response.ok) throw new Error('Nullstilling feilet. Kjører backend i Development?');
}
