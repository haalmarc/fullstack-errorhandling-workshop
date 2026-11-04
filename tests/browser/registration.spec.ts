import { expect, test, type Page } from '@playwright/test';

const start = process.env.WORKSHOP_VARIANT === 'start';
async function fill(page: Page, name = 'Nettleserstout') {
  await page.getByLabel('Navn', { exact: true }).fill(name);
  await page.getByLabel('Øltype', { exact: true }).selectOption('stouts');
  await page.getByLabel('Alkoholprosent').fill('5.2');
}
test.beforeEach(async ({ request, page }) => {
  await request.post('/api/debug/reset');
  await page.goto('/');
  await expect(page.getByRole('option', { name: 'Stout', exact: true })).toBeAttached();
});

test('vellykket registrering fungerer fra start og nullstiller bare etter suksess', async ({ page }) => {
  await fill(page);
  await page.getByRole('button', { name: 'Registrer øl', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Ølet er registrert.' })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'Nettleserstout' })).toBeVisible();
  await expect(page.getByLabel('Navn', { exact: true })).toHaveValue('');
});

test('startkoden viser den observerbare valideringsmangelen', async ({ page }) => {
  test.skip(!start);
  await fill(page, '');
  await page.getByRole('button', { name: 'Registrer øl', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Ølet er registrert.' })).toBeVisible();
  await expect(page.getByLabel('Navn', { exact: true })).toHaveAttribute('aria-invalid', 'false');
});

test.describe('løsningsforslagets feilkjeder', () => {
  test.skip(start);
  test('fetch avvises helt uten HTTP-respons', async ({ page }) => {
    await page.route('**/api/beers', async route => {
      if (route.request().method() === 'POST') await route.abort('failed');
      else await route.continue();
    });
    await fill(page);
    await page.getByRole('button', { name: 'Registrer øl', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Vi fikk ikke bekreftet registreringen.');
    await expect(page.getByLabel('Navn', { exact: true })).toHaveValue('Nettleserstout');
  });
  test('feltfeil og retting uten tap av innhold', async ({ page }) => {
    await fill(page, '');
    await page.getByLabel('Alkoholprosent').fill('21');
    await page.getByRole('button', { name: 'Registrer øl', exact: true }).click();
    await expect(page.getByText('Skriv inn et navn.', { exact: true })).toBeVisible();
    await expect(page.getByText('Alkoholprosent må være mellom 0 og 20.', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Navn', { exact: true })).toBeFocused();
    await expect(page.getByLabel('Alkoholprosent')).toHaveValue('21');
    await fill(page, 'Rettet stout');
    await page.getByRole('button', { name: 'Registrer øl', exact: true }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Rettet stout' })).toBeVisible();
    await expect(page.getByText('Skriv inn et navn.', { exact: true })).toBeHidden();
  });
  test('duplikat vises ved navn, resten beholdes', async ({ page }) => {
    await fill(page, ' kodepils ');
    await page.getByRole('button', { name: 'Registrer øl', exact: true }).click();
    await expect(page.getByText('Bryggeriet har allerede et øl med dette navnet.', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Navn', { exact: true })).toHaveValue(' kodepils ');
    await expect(page.getByLabel('Alkoholprosent')).toHaveValue('5.2');
    await expect(page.getByLabel('Øltype', { exact: true })).toHaveValue('stouts');
  });
  for (const fault of ['server', 'html', 'disconnect', 'saved-disconnect']) {
    test(`${fault}: trygg melding, beholdt innhold og mulig ny innsending`, async ({ page }) => {
      await page.getByText('Debugpanel for workshopen').click();
      await page.getByLabel('Feil ved innsending').selectOption(fault);
      await fill(page);
      await page.getByRole('button', { name: 'Registrer øl', exact: true }).click();
      const alert = page.getByRole('alert');
      await expect(alert).toContainText(fault === 'server' ? 'Referanse:' : 'Vi fikk ikke bekreftet registreringen.');
      await expect(alert).not.toContainText('SQLite');
      await expect(page.getByLabel('Navn', { exact: true })).toHaveValue('Nettleserstout');
      await expect(page.getByLabel('Alkoholprosent')).toHaveValue('5.2');
      await expect(page.getByRole('button', { name: 'Registrer øl', exact: true })).toBeEnabled();
      await page.getByLabel('Feil ved innsending').selectOption('');
      await page.getByRole('button', { name: 'Oppdater listen', exact: true }).click();
      if (fault === 'saved-disconnect') await expect(page.getByRole('listitem').filter({ hasText: 'Nettleserstout' })).toBeVisible();
      else {
        await page.getByRole('button', { name: 'Registrer øl', exact: true }).click();
        await expect(page.getByRole('listitem').filter({ hasText: 'Nettleserstout' })).toBeVisible();
      }
    });
  }
  for (const body of ['', '{', '{"type":"urn:unknown","title":"x","status":400,"errors":{"unknown":["x"]}}']) {
    test(`fallback ved uleselig eller ukjent kontrakt: ${body || 'tom'}`, async ({ page }) => {
      await page.route('**/api/beers', async route => {
        if (route.request().method() === 'POST') await route.fulfill({ status: 400, contentType: 'application/problem+json', body });
        else await route.continue();
      });
      await fill(page);
      await page.getByRole('button', { name: 'Registrer øl', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText('Vi fikk ikke bekreftet registreringen.');
      await expect(page.getByLabel('Navn', { exact: true })).toHaveValue('Nettleserstout');
    });
  }
});
