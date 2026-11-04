import type { Beer, BeerInput, SaveFault } from '../../shared/frontend/types';

export async function createBeer(beer: BeerInput, fault: SaveFault): Promise<Beer> {
  const response = await fetch('/api/beers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Workshop-Fault': fault },
    body: JSON.stringify(beer),
  });
  // Oppgave 1b: fetch avviser ikke Promise ved HTTP 400 eller 500.
  if (!response.ok) throw new Error('Registreringen feilet.');
  return response.json();
}
