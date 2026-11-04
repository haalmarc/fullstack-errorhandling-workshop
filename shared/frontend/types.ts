export type BeerInput = { name: string; beerType: string; abv: number };
export type Beer = BeerInput & { id: number; breweryId: number };
export type BeerType = { id: string; name: string };
export type BeerTypes = { items: BeerType[]; source: string };
export type SaveFault = '' | 'server' | 'html' | 'disconnect' | 'slow-save' | 'saved-disconnect';

export const fallbackMessage = 'Vi fikk ikke bekreftet registreringen. Innholdet er beholdt. Sjekk listen før du sender på nytt.';

export function isBeer(value: unknown): value is Beer {
  if (!value || typeof value !== 'object') return false;
  const b = value as Record<string, unknown>;
  return Number.isInteger(b.id) && typeof b.breweryId === 'number' &&
    typeof b.name === 'string' && typeof b.beerType === 'string' && typeof b.abv === 'number';
}
