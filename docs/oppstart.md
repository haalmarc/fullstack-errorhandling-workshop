# Oppstart

Alle kommandoer kjøres fra `errorhandling-workshop`, med mindre annet er angitt.
Åpne denne mappen i editoren; `shared/` må følge med arbeidskopien.

**Her skal dere jobbe:** `start/backend` og `start/frontend` er arbeidskoden.
`losningsforslag/` er en ferdig løsning til sammenligning, og `shared/` er
ferdige deler begge variantene bruker. Begynn med startkoden og kommandoene
under; dere trenger ikke kjøre løsningsforslaget for å gjøre oppgavene.

## Før samlingen: omtrent fem minutter

Installer **.NET SDK 10.0** (ikke bare runtime), **Node.js 24 LTS** og **npm 10
eller nyere**. Node 26 støttes også. `global.json` tillater stabile SDK-er i
10.0-serien fra 10.0.100; `.nvmrc` velger Node 24 hvis dere bruker nvm.
En moderne nettleser med utviklerverktøy er nok til oppgavene.

```sh
dotnet --version
node --version
npm --version
npm ci
```

Første installasjon trenger tilgang til npmjs.org og nuget.org. `NuGet.Config`
bruker kun den offentlige kilden, slik at private pakkekilder fra jobboppsett
ikke krever innlogging. SQLite-biblioteket leveres av NuGet-pakkene.
Backendpakkene er versjonsfestet i prosjektfilene; npm bruker `package-lock.json`.

## Kjør startkoden

Terminal 1:

```sh
dotnet watch --project start/backend run --no-launch-profile -- --environment Development
```

Terminal 2:

```sh
npm run dev
```

Åpne <http://localhost:5173>. Backend bruker <http://localhost:5050>.
Vite sender `/api` videre til backend, så CORS og utviklingssertifikat er ikke
en del av oppsettet. Begge må kjøre. `Development` trengs for debugpanelets
backendfunksjoner. Ved C#-endringer som krever omstart, godta omstart i watch.

**👉 Begynn på oppgavene:** La begge terminalene kjøre og åpne
[hovedoppgavene](oppgaver.md). Start med **oppgave 0: Finn en fungerende
innsending**, som sjekker at startkoden fungerer. En gyldig registrering skal
allerede kunne lagres og vises i listen. Første kodeendring er i **oppgave 1a**, i
`start/backend/BeerEndpoints.cs`. Frontendendringene kommer deretter i
`start/frontend/api.ts` og `start/frontend/useRegistration.ts`.

## Hvis det åpne API-et er nede eller blokkert

Backend forsøker normalt SampleAPIs over HTTPS, uten nøkkel. Klienten har
åtte sekunders timeout per kall og gjør to sekvensielle kall. Ved feil ser dere
en innlastingsmelding. Bruk eksplisitt lokal datamodus for å fortsette:

Stopp backend med Ctrl+C, og start den slik:

```sh
dotnet watch --project start/backend run --no-launch-profile -- --environment Development --BeerTypes:Offline true
```

Last siden på nytt. UI-et skal si «lokale workshopdata». Samme to typer brukes,
og alle hovedoppgaver fungerer. Dette er en valgt datamodus, ikke en skjult
automatisk fallback. Se [API-vurderingen](kilder.md#valg-av-eksternt-api).

## Database og nullstilling

Filen `start/backend/data/brewery.db` opprettes automatisk med startdata. Vanlig
omstart beholder registreringene. Løsningsforslaget bruker sin egen fil under
`losningsforslag/backend/data`. Bare workshopdata lagres i disse filene.

Åpne debugpanelet og trykk **Nullstill database**. Dette sletter registreringene
og legger tilbake `Kodepils`. Skjemainnholdet endres ikke. Unngå pågående
innsending mens dere nullstiller.

Alternativt: stopp backend og kjør én kommando som nullstiller og avslutter:

```sh
dotnet run --project start/backend --no-launch-profile -- --reset-db
```

Start backend igjen som over. For løsningsforslaget bytter dere `start` med `losningsforslag`.

## Valgfritt: Kjør løsningsforslaget

Stopp begge startprosessene først; de bruker de samme portene.

```sh
dotnet watch --project losningsforslag/backend run --no-launch-profile -- --environment Development
```

I den andre terminalen:

```sh
npm run dev:losningsforslag
```

`--BeerTypes:Offline true` fungerer også på løsningsforslaget. `npm run dev` velger
alltid startfrontend, mens `npm run dev:losningsforslag` velger løsningsforslagets frontend.
Pass på at backend og frontend tilhører samme variant ved sammenligning.

## Vanlige oppstartsproblemer

| Observasjon | Sjekk |
| --- | --- |
| SDK not found / incompatible | `dotnet --version` må vise 10.0.x fra workshopmappen. |
| npm engine-feil | Bruk Node 24 eller 26. Kjør `npm ci` etter bytte. |
| Port already in use | Stopp tidligere Vite/.NET-prosess; det skal bare være ett par. |
| Proxy connection refused | Sjekk backendterminalen og <http://localhost:5050/api/health>. |
| Ingen øltyper | Les backendloggen, prøv lokal datamodus og last siden på nytt. |
| Debug nullstilling gir 404 | Start backend med `--environment Development`. |
| Ingen endring i React | Rediger `start/frontend`; sjekk at Vite ikke kjører løsningsforslaget. |

Startkode viser med vilje interne feildetaljer. Kjør den lokalt i workshopen.
Debugpanelet er kun med i Vites utviklingsmodus, og backend ignorerer
feilsimulering og skjuler reset-endepunktet utenfor Development.

## For arrangøren: Teknisk sjekk før utdeling

Stopp manuelle servere før nettlesertestene:

```sh
dotnet build start/backend
dotnet build losningsforslag/backend
npm run build
npm test
npm run check:api
npx playwright install chromium
npm run test:e2e
```

API-sjekken forutsetter byggene over. Den starter egne prosesser
på port 5059 og bruker midlertidige databaser. Nettlesertestene starter begge
servere på 5050/5173, med egne lokale testdatabaser og uten eksternt API.

På macOS/Linux kan startvarianten også prøves automatisk:

```sh
WORKSHOP_VARIANT=start npm run test:e2e
```

I PowerShell: `$env:WORKSHOP_VARIANT='start'`, kjør testen, fjern deretter med
`Remove-Item Env:WORKSHOP_VARIANT`.

For å bekrefte ekte eksterne kall gjennom backend:

```sh
npm run check:api -- --live
```

Før samlingen må noen fortsatt følge denne veiledningen på en annen maskin.
