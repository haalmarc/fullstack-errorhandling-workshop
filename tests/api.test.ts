import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiProblem, createBeer, isProblem } from '../losningsforslag/frontend/api';

const input = { name: 'Test', beerType: 'stouts', abv: 4.7 };
afterEach(() => vi.unstubAllGlobals());

describe('grensen mot API-et', () => {
  it('gjenkjenner en feltfeil og beholder HTTP-status separat', async () => {
    const problem = { type: 'urn:brewery:problem:validation', title: 'Kontroller', status: 400, errors: { name: ['Navn mangler.'] } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(problem), {
      status: 400, headers: { 'Content-Type': 'application/problem+json; charset=utf-8' },
    })));
    await expect(createBeer(input, '')).rejects.toMatchObject({ problem, status: 400 });
  });
  it.each([
    [502, '<html>Proxyfeil</html>', 'text/html'],
    [500, '', 'application/problem+json'],
    [400, '{"type":"x","title":"x","status":400,"errors":{"name":"feil"}}', 'application/problem+json'],
    [400, '{"type":"x","title":"x","status":409}', 'application/problem+json'],
    [200, '{"message":"Ikke lagret"}', 'application/json'],
    [201, '{}', 'application/json'],
  ])('lar uventet respons (%i) gå til fallback', async (status, body, contentType) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status, headers: { 'Content-Type': contentType } })));
    const error = await createBeer(input, '').catch(error => error);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ApiProblem);
  });
  it('avviser ikke-feilobjekter uten å kaste i parseren', () => {
    for (const value of [null, [], 'oops', {}, { type: 'x', title: 'x', status: 500, traceId: 1 }]) expect(isProblem(value)).toBe(false);
  });
  it('lar nettverksbrudd gå til fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(createBeer(input, '')).rejects.toThrow('Failed to fetch');
  });
});
