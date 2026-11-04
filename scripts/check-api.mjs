import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { once } from 'node:events';

const temporary = await mkdtemp(join(tmpdir(), 'brewery-check-'));
const live = process.argv.includes('--live');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function check(variant, environment = 'Development') {
  const root = resolve(`${variant}/backend`);
  let logs = '';
  const server = spawn('dotnet', [join(root, 'bin/Debug/net10.0/Brewery.Api.dll'),
    '--contentRoot', root, '--urls', 'http://127.0.0.1:5059', '--environment', environment,
    '--BeerTypes:Offline', String(!live), '--DatabasePath', join(temporary, `${variant}-${environment}.db`)],
    { stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', data => { logs += data; });
  server.stderr.on('data', data => { logs += data; });
  const base = 'http://127.0.0.1:5059';
  const post = (body, fault = '') => fetch(`${base}/api/beers`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Workshop-Fault': fault },
    body: JSON.stringify(body),
  });
  const valid = { name: 'Ny stout', beerType: 'stouts', abv: 5.2 };
  async function problem(response, status) {
    assert.equal(response.status, status);
    assert.match(response.headers.get('content-type'), /^application\/problem\+json/);
    const body = await response.json();
    assert.equal(body.status, status);
    return body;
  }
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { ready = (await fetch(`${base}/api/health`)).ok; } catch { /* wait for host */ }
      if (ready) break;
      if (server.exitCode !== null) throw new Error(logs);
      await pause(100);
    }
    assert.ok(ready, logs);
    const catalogResponse = await fetch(`${base}/api/beer-types`);
    assert.equal(catalogResponse.status, 200);
    const catalog = await catalogResponse.json();
    assert.equal(catalog.items.length, 2);
    assert.equal(catalog.source, live ? 'sampleapis' : 'local');

    const savedResponse = await post(valid);
    assert.equal(savedResponse.status, 201);
    const saved = await savedResponse.json();
    assert.equal(saved.name, valid.name);
    assert.equal((await fetch(`${base}${savedResponse.headers.get('location')}`)).status, 200);

    if (variant === 'start') {
      assert.equal((await post({ ...valid, name: '', abv: 21 })).status, 200);
      const duplicate = await post({ ...valid, name: ' kodepils ' });
      assert.equal(duplicate.status, 500);
      assert.match((await duplicate.json()).message, /UNIQUE constraint failed/);
      console.log('OK start: suksess, bevisst feilaktig valideringsrespons, ekte unikhetsfeil');
      return;
    }

    const invalid = await problem(await post({ name: ' ', beerType: '', abv: 21 }), 400);
    assert.deepEqual(Object.keys(invalid.errors).sort(), ['abv', 'beerType', 'name']);
    assert.equal(invalid.type, 'urn:brewery:problem:validation');
    await problem(await post({ ...valid, abv: null }), 400);
    await problem(await post({ ...valid, name: 'a'.repeat(81) }), 400);
    for (const abv of [0, 20]) assert.equal((await post({ ...valid, name: `Grense ${abv}`, abv })).status, 201);
    const duplicate = await problem(await post({ ...valid, name: ' kOdePils ' }), 409);
    assert.equal(duplicate.type, 'urn:brewery:problem:duplicate-beer');
    assert.ok(duplicate.errors.name);
    assert.ok(!JSON.stringify(duplicate).includes('SQLite'));
    const race = await Promise.all([post({ ...valid, name: 'Samtidig' }), post({ ...valid, name: 'Samtidig' })]);
    assert.deepEqual(race.map(r => r.status).sort(), [201, 409]);

    if (environment === 'Development') {
      const unexpected = await problem(await post({ ...valid, name: 'Ikke lagret' }, 'server'), 500);
      assert.match(unexpected.traceId, /^[0-9a-f]{32}$/);
      assert.ok(!/SQLite|missing_workshop_column|SELECT|stack/i.test(JSON.stringify(unexpected)));
      await pause(150);
      assert.equal(logs.split(`TraceId=${unexpected.traceId}`).length - 1, 1);
      assert.match(logs, /missing_workshop_column/);
      const html = await post(valid, 'html');
      assert.equal(html.status, 502);
      assert.match(html.headers.get('content-type'), /text\/html/);
      assert.match(await html.text(), /Proxy/);
      await assert.rejects(() => post({ ...valid, name: 'Avbrutt' }, 'disconnect'));
      await assert.rejects(() => post({ ...valid, name: 'Lagret uten svar' }, 'saved-disconnect'));
      const list = await (await fetch(`${base}/api/beers`)).json();
      assert.ok(list.some(b => b.name === 'Lagret uten svar'));
      assert.ok(!list.some(b => b.name === 'Avbrutt' || b.name === 'Ikke lagret'));
      const upstream = await problem(await fetch(`${base}/api/beer-types?fault=not-found`), 500);
      assert.equal(upstream.type, 'urn:brewery:problem:unexpected');
      assert.equal((await fetch(`${base}/api/debug/reset`, { method: 'POST' })).status, 204);
      assert.equal((await (await fetch(`${base}/api/beers`)).json()).length, 1);
      console.log('OK losningsforslag: 201, 400, 409, samtidighet, trygg 500, sporings-ID i én logg, HTML, brudd før/etter lagring, reset');
    } else {
      assert.equal((await fetch(`${base}/api/debug/reset`, { method: 'POST' })).status, 404);
      assert.equal((await post({ ...valid, name: 'Ingen debug i Production' }, 'server')).status, 201);
      console.log('OK Production: debug-endepunkt og feilsimulering er avslått');
    }
  } catch (error) {
    console.error(logs);
    throw error;
  } finally {
    server.kill('SIGTERM');
    if (server.exitCode === null) await once(server, 'exit');
  }
}

try {
  await check('start');
  await check('losningsforslag');
  await check('losningsforslag', 'Production');
  if (live) console.log('OK live: ølkategoriene er hentet gjennom begge backender fra SampleAPIs');
} finally { await rm(temporary, { recursive: true, force: true }); }
