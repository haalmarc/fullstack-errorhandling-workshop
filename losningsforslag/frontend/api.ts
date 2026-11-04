import { isBeer, type Beer, type BeerInput, type SaveFault } from '../../shared/frontend/types';

export type Problem = {
  type?: string;
  title?: string;
  status?: number;
  errors?: Record<string, string[]>;
  traceId?: string;
};

export class ApiProblem extends Error {
  constructor(public problem: Problem, public status: number) {
    super('API-et svarte med Problem Details.');
  }
}

export function isProblem(value: unknown): value is Problem {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  // Avgrenset workshopkontrakt, strengere enn RFC-ens valgfrie standardfelt.
  if (typeof p.type !== 'string' || typeof p.title !== 'string' || typeof p.status !== 'number') return false;
  if (p.traceId !== undefined && typeof p.traceId !== 'string') return false;
  return p.errors === undefined || (!!p.errors && typeof p.errors === 'object' && !Array.isArray(p.errors) &&
    Object.values(p.errors).every(v => Array.isArray(v) && v.length > 0 && v.every(m => typeof m === 'string')));
}

export async function createBeer(beer: BeerInput, fault: SaveFault): Promise<Beer> {
  const response = await fetch('/api/beers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, application/problem+json', 'X-Workshop-Fault': fault },
    body: JSON.stringify(beer),
  });
  if (!response.ok) {
    if (response.headers.get('Content-Type')?.split(';')[0].trim() === 'application/problem+json') {
      const body: unknown = await response.json();
      if (isProblem(body) && body.status === response.status) throw new ApiProblem(body, response.status);
    }
    throw new Error('Uventet feilrespons.');
  }
  const body: unknown = await response.json();
  if (response.status !== 201 || !isBeer(body)) throw new Error('Uventet kvittering.');
  return body;
}
