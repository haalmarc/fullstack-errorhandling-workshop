# Hovedoppgaver

Jobb i `start/`. [Oppstarten](oppstart.md) skal være gjennomført. Åpne
Network-panelet i nettleseren, velg Fetch/XHR og behold backendterminalen synlig.
Det er lov å bruke [løsningsforslaget](losningsforslag.md) underveis. Oppgavene er beregna å gjøres i grupper på 2-3 personer, så bytt hvem som taster underveis.

Emojiene gir tegn på type informasjon:

- 👉 Oppgave: Gjør endringen eller prøv oppførselen.
- 💡 Refleksjon: Diskuter hva dere observerer og hvorfor.
- 📖 Lesestoff og støtte: Bruk løsningsforslaget eller les videre.

## 👉 0. Finn en fungerende innsending

**Mål:** Se flyten før dere endrer den.

1. Registrer `Terminalstout`, Stout, 5,2 %. Finn POST `/api/beers` i Network.
2. Se status, respons og `Location`. Finn ølet i listen.
3. Åpne `start/frontend/useRegistration.ts`, `api.ts` og
   `start/backend/BeerEndpoints.cs`. Følg det vellykkede kallet til
   `BeerService.Create` og `shared/backend/BeerDatabase.cs`.

**💡 Refleksjon:** Hva er beviset for at ølet er lagret? Når tømmes skjemaet?

## 1. Feltfeil gjennom hele kjeden

**Mål:** En feil brukeren kan rette, gir riktig HTTP-respons og riktig feltfeil.

### 👉 Observer først

Velg Stout, la navn være tomt og send inn. Se både Network og skjemaet.
Blir noe lagret? Hvorfor sier UI-et likevel at ølet er registrert?
Noter hvilke opplysninger React trenger for å vise feilen på riktig sted.

### 👉 1a. Gi feltfeilen en riktig respons

I `start/backend/BeerEndpoints.cs`: Bytt bare responsen inne i
`if (errors.Count > 0)` til:

```csharp
return Results.ValidationProblem(errors,
    title: "Kontroller feltene i skjemaet.",
    type: "urn:brewery:problem:validation");
```

Prøv tomt navn igjen. Kontroller **400**, `application/problem+json` og
`errors.name`. UI-et skal nå vise en generell feil, og beholde alkohol og type.
Dere har rettet én konkret feil allerede. Regler og skjema er ferdige fra før.

**💡 Refleksjon:** Hva er forskjellen på denne løsningen versus det som var? Er det fortsatt noe som mangler?

### 👉 1b. Ta med feltinformasjonen til React

I `start/frontend/api.ts`: Lag en liten `ApiProblem extends Error` som bærer
HTTP-status og en Problem Details-body. Hvis `response.ok` er `false`, les JSON og
kast `ApiProblem`. Bruk typen og klassen fra
[`losningsforslag/frontend/api.ts`](../losningsforslag/frontend/api.ts) som støtte.

Her kan dere foreløpig anta lesbar JSON. Robust lesing kommer i oppgave 4.
Typefeltene dere trenger nå er `type`, `status`, `title` og
`errors?: Record<string, string[]>`.

Prøv igjen og inspiser objektet i en breakpoint i `catch` i
`useRegistration.ts`. Det er fortsatt bare en generell melding i UI-et.

### 👉 1c. Vis feil ved riktig felt

I `start/frontend/useRegistration.ts`: Når `ApiProblem` har HTTP 400 og
typen `urn:brewery:problem:validation`, knytt `errors` til de kjente feltene
`name`, `beerType` og `abv` med `form.setError`.

Begynn med `name`. Bruk `{ type: 'server', message: ... }`, og
`{ shouldFocus: true }` for første felt. JSX for visning, `aria-invalid` og
`aria-describedby` er allerede koblet opp i `shared/frontend/App.tsx`.
Utvid så til alle tre feltene. Ikke kall `reset` hvis registreringen feiler.

**👉 Prøv igjen:** Tomt navn, deretter navn `Testøl` og alkohol 21. Prøv også tomt
tallfelt. Rett feilene og send inn. Innholdet skal beholdes ved feil, første
feilfelt skal få fokus, gammel feil skal forsvinne ved ny innsending og et
gyldig øl skal lagres. `clearErrors` og `reset` på suksess finnes allerede.

**💡 Refleksjon:** Hvem kan rette disse feilene? Hva skjer om en annen klient
hopper over React-valideringen? Hvorfor er `errors` en utvidelse av Problem
Details og ikke et standardfelt i RFC-en?

**📖 Støtte og lesestoff:** [Kontrakt](kontrakt.md), [løsningsforslag 1](losningsforslag.md#1-feltvalidering),
[RFC 9457 §3](https://www.rfc-editor.org/rfc/rfc9457.html#section-3),
[RHF setError](https://react-hook-form.com/docs/useform/seterror).

## 2. Duplikat er en forventet domenefeil

**Mål:** Tolke én kjent databasefeil og gjøre den nyttig for brukeren.

### 👉 Observer først

Registrer `Kodepils`, Stout, 4,7 %. Ølet finnes i startdata. Se responsen og
loggen. Prøv ` kodepils ` også. Finn den sammensatte unike indeksen i
`shared/backend/BeerDatabase.cs`.

### 👉 2a. Oversett den kjente SQLite-feilen

I `start/backend/BeerService.cs`: Legg en spesifikk `catch` **før** den brede
catch-blokken. Fang `SqliteException` bare når
`BeerDatabase.IsBeerNameConflict(exception)` er sann, og kast
`new DuplicateBeerException(exception)`. Typen og gjenkjenningen er ferdige i
`shared/`; legg til `using Microsoft.Data.Sqlite;`.

C# har exception-filtre, som Java mangler: `catch (SqliteException exception) when
(BeerDatabase.IsBeerNameConflict(exception))` fanger bare når betingelsen er sann.

Prøv igjen. Endepunktets brede catch gir fortsatt 500, men innholdet i feilen
har endret seg. Følg exception-typen fra tjenesten med debuggeren
([slik starter dere den](oppstart.md#debugging-av-backend)).

### 👉 2b. Gi domenekonflikten HTTP 409

I `BeerEndpoints.cs`: Fang `DuplicateBeerException` før den brede catch-blokken.
Returner `Results.ValidationProblem` med `errors.name`, status 409 og
`type: "urn:brewery:problem:duplicate-beer"`. Bruk teksten
«Bryggeriet har allerede et øl med dette navnet.».

Prøv igjen. Se at SQL og exception-navn er borte fra responsen, og at 409 og
feltnavnet er på plass.

### 👉 2c. Gjenbruk feltvisningen

I `useRegistration.ts`: La også HTTP 409 med den nye typen gå gjennom samme
feltkobling som validering. Ikke innfør tekstsøk etter «allerede» i klienten.

**👉 Prøv igjen:** `Kodepils`, så ` kodepils `. Begge skal gi feil ved navnefeltet,
beholde alle verdier og la dere velge et nytt navn og lykkes.

**💡 Refleksjon:** Kan en «finnes navnet?»-sjekk før INSERT garantere unikhet når to
forespørsler kommer samtidig? Hvorfor skal ikke alle `SqliteException` bli 409?

**📖 Støtte og lesestoff:** [Løsningsforslag 2](losningsforslag.md#2-duplikat),
[SQLite 2067](https://www.sqlite.org/rescode.html#constraint_unique),
[HTTP 409](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.10).

## 3. Uventet feil og riktig ansvar

**Mål:** Brukeren får en trygg melding; utvikleren får tekniske detaljer og en
referanse som faktisk kan slås opp.

### 👉 Observer først

Velg **Uventet SQLite-feil før lagring** i debugpanelet. Bruk et nytt, gyldig
navn. Feilen er en ekte «no such column»-feil. Se hva responsen røper.
Les de brede catch-blokkene i `BeerService` og `BeerEndpoints`.
En vanlig innsendingsfeil kan logges i begge lag; debugfeilen skjer allerede
før `service.Create` og viser bare endepunktets logging.

### 👉 3a. Fjern catch som ikke kan håndtere feilen

Fjern den brede `catch (Exception ...)` fra **tjenesten** og tilhørende logger
fra konstruktøren. Behold den spesifikke oversettelsen av navnekonflikten.

Prøv duplikat igjen. Det skal fortsatt være en feltfeil. Tjenesten skal ikke
logge og kaste videre samme feil uten å tilføre noe.

### 👉 3b. Flytt fallback til en sentral handler

Dette er det største steget i workshopen. Det er helt greit å kopiere
handleren og registreringen fra løsningsforslaget og bruke tiden på å forstå
hvorfor de ser slik ut: hvem eier loggingen, og hvorfor står fallback sentralt?
For Spring-utviklere tilsvarer `IExceptionHandler` omtrent `@RestControllerAdvice`,
og `UseExceptionHandler()` en plass tidlig i filterkjeden.

Opprett `start/backend/UnexpectedExceptionHandler.cs` med `IExceptionHandler`.
Bruk [løsningsforslagets handler](../losningsforslag/backend/UnexpectedExceptionHandler.cs) som
skjelett: hent `Activity.Current?.TraceId.ToString()` (fallback
`context.TraceIdentifier`), logg exception med referansen og skriv en trygg
500 Problem Details-respons med samme `traceId`. Returner `true` etter at
responsen er skrevet.

I `Program.cs`, registrer `AddProblemDetails` med `CustomizeProblemDetails` som
setter samme korte sporings-ID-format, og
`AddExceptionHandler<UnexpectedExceptionHandler>()`. Legg `app.UseExceptionHandler()`
før endepunktene. Se [løsningsforslagets Program.cs](../losningsforslag/backend/Program.cs).

Fjern så endepunktets brede catch og loggerparameter. Behold lokal catch for
`DuplicateBeerException`: her oversettes et forventet utfall bevisst til HTTP.
Fjern eventuelle ubrukte loggerparametere, slik at koden bygger.

**👉 Prøv:** Debugfeilen skal nå gi 500 med trygg tekst og `traceId`, uten SQL,
kolonnenavn eller stack trace. Finn den samme ID-en i backendloggen og se at
loggen inneholder den tekniske årsaken. Pass på at ID-en er identisk, ikke
bare lik: standard rammeverks-ID kan ellers ha et annet format.

### 👉 3c. Vis fellesfeil med referanse

I frontend: Legg `traceId?: string` til feiltypen. Ved `ApiProblem` med status
500 eller høyere, sett `root.server` med en forståelig, egen tekst og eventuell
referanse. Ikke bruk `exception.Message`, vilkårlig `detail` eller HTML som
brukertekst. Behold alle feltverdier.

**👉 Prøv igjen:** Utløs serverfeilen. Kopier referansen fra UI-et og finn loggen.
Velg «Ingen» i panelet og send samme skjema. Prøv duplikat og validering igjen.

**💡 Refleksjon:** Hvilket lag kan faktisk tolke navnekonflikten? Hva kan brukeren
gjøre med en intern databasefeil? Når gir en lokal catch mening? Hva er
kostnaden ved å logge samme exception i flere lag?

**📖 Støtte og lesestoff:** [Løsningsforslag 3](losningsforslag.md#3-uventede-feil),
[ASP.NET IExceptionHandler og .NET 10-diagnostikk](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling?view=aspnetcore-10.0#iexceptionhandler),
[RFC 9457 §5](https://www.rfc-editor.org/rfc/rfc9457.html#section-5).

## 4. Når kontrakten ikke kommer fram

**Mål:** Ingen feilrespons skal føre til stille feil, tapt innhold eller falsk
kvittering.

### 👉 Observer først

Velg **HTML fra proxy (502)**. Send et gyldig øl. Hva skjer når `response.json()`
leser HTML? Prøv deretter **Forbindelsen brytes før lagring**. Lokal Vite-proxy
kan gjøre bruddet om til en HTTP 500 uten JSON. For å prøve helt uten respons:
bruk nettleserens Network → Offline etter at siden er lastet, og send inn.
Slå Offline av etterpå.

### 👉 4a. Les responsen uten å stole blindt på formatet

I `api.ts`: Bruk `Content-Type` før lesing som Problem Details, les til `unknown`
og sjekk formen på objektet. En TypeScript-type alene validerer ikke JSON.
Bruk gjerne `isProblem` fra løsningsforslaget. Sjekk HTTP-status mot `body.status`.
Uleselig JSON, tom body eller ukjent form skal gi en vanlig feil til fallback.
På suksess: krev 201 og en faktisk ølkvittering; `isBeer` finnes i
`shared/frontend/types.ts`.

### 👉 4b. Gi alle resterende feil en forståelig fallback

I `useRegistration.ts`: Alle feil som ikke er gjenkjent, skal gi `root.server`
med `fallbackMessage` fra `shared/frontend/types.ts`. Ikke vis JavaScript-feilen
eller proxyteksten. Godta bare kjente feltnavn ved feltkobling. Hvis ingen felt
gjenkjennes, eller noen feltnavn er ukjente, vis også en felles fallback.

**👉 Prøv igjen:** HTML, avbrutt forbindelse og Offline. Prøv så normal innsending.
Alle feil skal beholde navn, type og alkohol, og knappen skal bli tilgjengelig
igjen. Ingen feil skal gi «Ølet er registrert».

**💡 Refleksjon:** Betyr manglende svar at ølet ikke ble lagret? Hvorfor er det
tryggere å si «Vi fikk ikke bekreftet registreringen» enn «Ingenting er lagret»?
Det finnes et eget debugvalg for dette i fordypningen.

**📖 Støtte og lesestoff:** [Løsningsforslag 4](losningsforslag.md#4-frontend-fallback),
[Fetch og feilstatuser](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_response_status).

## ✅ Når kjernen virker

Prøv én gyldig registrering og én av hver feiltype. Forklar for hverandre hvem
som må gjøre noe: brukeren, systemet eller begge. Velg deretter én
[fordypning](fordypning.md). [Løsningsforslaget](losningsforslag.md#ved-ulik-progresjon) gir
konkrete snarveier hvis gruppa vil prioritere én side.

### 💡 Større drøftinger

- Når er en feltfeil riktig presentasjon av en domenefeil, og når er den det ikke?
- Hvilken feilkontrakt ville dere avtalt mellom faggruppene i et ekte prosjekt?
- Når er try/catch gjenoppretting, og når skjuler det bare ansvarsfordelingen?
- Hvilke opplysninger trenger support, og hvilke skal ikke ut til brukeren?
- Hvilke feil kan et nytt forsøk løse? Hvilke kan det gjøre vanskeligere?
- Hvordan gjør dere feilkontrakten kompatibel når backend og frontend deployes
  på forskjellige tidspunkter?
