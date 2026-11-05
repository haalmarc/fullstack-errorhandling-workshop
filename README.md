# Feilhåndtering fra SQLite til React

En praktisk workshop for blandede grupper på 2–3 personer. Dere registrerer øl i
Kodebryggeriet og følger én feiltype gjennom hele kjeden før dere tar neste.
Målet er å skille mellom det brukeren kan rette, og det systemet må ta ansvar for.

**Begynn med [oppstart](docs/oppstart.md), deretter [oppgavene](docs/oppgaver.md).**

## Start her

Åpne repomappen (`fullstack-errorhandling-workshop`) i editoren. Følg først
[installasjonssjekken](docs/oppstart.md#før-samlingen-omtrent-fem-minutter).
Kjør deretter programmet fra denne mappen i to terminaler:

**Terminal 1 – backend:**

```sh
dotnet watch --project start/backend run --no-launch-profile -- --environment Development
```

**Terminal 2 – frontend:**

```sh
npm run dev
```

Åpne <http://localhost:5173> og begynn med **oppgave 0: Finn en fungerende
innsending** i [hovedoppgavene](docs/oppgaver.md). Den sjekker at startkoden
fungerer ved å lagre en gyldig registrering. Første kodeendring kommer i
oppgave 1a, i `start/backend/BeerEndpoints.cs`.

Dere jobber i **`start/`**. **`losningsforslag/`** inneholder en ferdig løsning
dere kan sammenligne med, og **`shared/`** inneholder ferdige deler begge bruker.
Dere trenger bare å kjøre startvarianten for å gjøre hovedoppgavene.

## Arbeidsform

- **Én maskin per gruppe.** Gruppa på 2–3 personer koder sammen på én maskin,
  helst koblet til en stor skjerm. Oppgavene følger én feil gjennom hele kjeden,
  og diskusjonen er en stor del av utbyttet.
- **Bytt hvem som taster per feiltype.** Én taster, de andre navigerer. La gjerne
  den som kjenner laget minst, taste: frontendutvikleren på C#-oppgavene og
  backendutvikleren på React-oppgavene.
- **Alle installerer likevel.** Følg [oppstarten](docs/oppstart.md) på egen maskin
  før samlingen, slik at gruppa har en reserve og alle kan prøve selv etterpå.
- **Løsningsforslaget er lov.** Bruk det når dere står fast. Målet er å forstå
  ansvarsfordelingen, ikke å skrive all koden selv.

## Verktøy

- **Editor:** VS Code anbefales som felles valg; repoet foreslår C#-utvidelsen
  (`ms-dotnettools.csharp`) når mappen åpnes. C# Dev Kit er valgfritt; sjekk
  lisensvilkårene for bedriftsbruk. Rider er et godt alternativ for den som
  bruker JetBrains til vanlig. I Rider eller Visual Studio åpner dere
  `start/Start.slnx`. Løsningsforslaget har sin egen `losningsforslag/Losningsforslag.slnx`,
  slik at dere ikke kjører eller redigerer feil variant ved et uhell.
- **Nettleserens utviklerverktøy:** Network-fanen (Fetch/XHR og Offline) brukes
  i nesten alle oppgavene.
- **Debugger:** Se [debugging av backend](docs/oppstart.md#debugging-av-backend).
  I VS Code kan begge serverne også startes med oppgaven
  *Workshop: start backend og frontend*.

## Materialet

| Mappe / dokument | Innhold |
| --- | --- |
| `start/backend` og `start/frontend` | Arbeidskopien deres. Vellykket registrering fungerer; feilhåndteringen er bevisst mangelfull. |
| `losningsforslag/backend` og `losningsforslag/frontend` | Kjørbart løsningsforslag til hele kjernen. |
| `shared/backend` | SQLite, regler, startdata, ekstern klient og debugstøtte. |
| `shared/frontend` | Ferdig skjema, visning, innlasting og debugpanel. |
| [Oppgaver](docs/oppgaver.md) | Små steg med observasjon, endring og ny utprøving. |
| [Løsningsforslag og avveininger](docs/losningsforslag.md) | Forklaring, relevante filer og snarveier ved ulik progresjon. |
| [Feilkontrakt](docs/kontrakt.md) | HTTP, Problem Details og feltkobling. |
| [Fordypning](docs/fordypning.md) | Lokalisering, innlasting, eksterne feil, retry og sporing. |
| [Kilder og API-valg](docs/kilder.md) | Primærkilder og vurdering av ekstern tjeneste. |
| [Verifikasjon](docs/verifikasjon.md) | Tekniske sjekker og utprøving som fortsatt gjenstår. |

Sett av omtrent 85–100 minutter til kjernen, med rom til å bruke resten av de
120 praktiske minuttene på å fullføre eller velge fordypning. Dette er et anslag,
ikke observert deltakerprogresjon. Ta korte refleksjoner mens dere koder. Større
drøftinger står etter kjernen. Intro, avslutning og plassering av fellesbolker
forberedes separat.

## Kjedene dere arbeider med

```text
React Hook Form → fetch → Minimal API → tjeneste → SQLite
                  ↑           ↓
             felt / fellesfeil ← Problem Details

React → egen backend → BeerTypesClient → SampleAPIs
```

Navn er obligatorisk, trimmes, har høyst 80 tegn og skal være unikt per bryggeri.
Alkoholprosent er obligatorisk og mellom 0 og 20, inklusive grensene. Øltype er
`stouts` eller `red-ale`. Bryggeri 1 er fast for hele skjemaet. `Kodepils` finnes
fra start. Navnet er et fiktivt merkenavn; startølets type er Stout.

Ingen Docker, databaseinstallasjon eller API-nøkkel trengs. Dere bruker React 19,
React Hook Form 7, TypeScript, Vite og .NET 10 Minimal APIs. Kun .NET-backend er
med i denne versjonen.
