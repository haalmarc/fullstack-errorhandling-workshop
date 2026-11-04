# Kilder og API-valg

Dokumentasjon og endepunkter undersøkt 3. november 2026. Kildene er knyttet
til valgt .NET 10 / React Hook Form 7, og løsningsforslaget er bygget og prøvd lokalt.

## Hovedoppgavene

| Tema | Primærkilde / offisiell dokumentasjon | Hva dere finner der |
| --- | --- | --- |
| Problem Details | [RFC 9457 §3 og §5](https://www.rfc-editor.org/rfc/rfc9457.html) | Standardfelter, utvidelser, medietype og sikkerhet |
| HTTP-status | [RFC 9110 §15](https://www.rfc-editor.org/rfc/rfc9110.html#section-15) | 400, 409, 422 og 5xx har forskjellig betydning |
| ASP.NET API-feil | [Handle errors in ASP.NET Core APIs, .NET 10](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling-api?view=aspnetcore-10.0) | `AddProblemDetails`, rammeverksstøtte og feilresponser |
| Sentral exception-håndtering | [IExceptionHandler og SuppressDiagnosticsCallback](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling?view=aspnetcore-10.0#iexceptionhandler) | Registrering, middleware og endret logging i .NET 10 |
| Felt- og fellesfeil | [React Hook Form setError](https://react-hook-form.com/docs/useform/seterror) og [clearErrors](https://react-hook-form.com/docs/useform/clearerrors) | `root`, feltmapping og fokus |
| SQLite-feilkoder | [Result and Error Codes](https://www.sqlite.org/rescode.html#constraint_unique) | 19 er constraint; 2067 er unikhetsbrudd |
| Unik indeks | [SQLite CREATE INDEX](https://www.sqlite.org/lang_createindex.html#unique_indexes) | Databasen håndhever unikheten |
| SQLite i .NET | [Database errors](https://learn.microsoft.com/en-us/dotnet/standard/data/sqlite/database-errors) | `SqliteException`, hovedkode og utvidet kode |
| Fetch | [MDN Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) | HTTP-feil avviser ikke automatisk Promise; lesing kan feile |
| Retry | [RFC 9110 §9.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2) | Idempotens og risiko ved automatisk retry |

MDN er brukt som praktisk API-dokumentasjon; HTTP-semantikk og feilformat
forankres i RFC-ene. Fordypningene har egne, mer avgrensede kildelenker.

## Valg av eksternt API

### Valgt: SampleAPIs

- [Prosjekt og bruksvilkår](https://github.com/jermbo/SampleAPIs#readme).
  Gratis undervisnings-/øvingstjeneste uten nøkkel, token eller registrering.
  Leveres «as is», kan endres eller avvikles uten varsel; ingen tilgjengelighetsgaranti.
- Programvaren er [MIT-lisensiert](https://github.com/jermbo/SampleAPIs/blob/main/LICENSE).
  Prosjektet sier uttrykkelig at datainnholdet er til undervisning og ikke eies
  av SampleAPIs. Det er ikke det samme som en generell åpen lisens på alle bilder
  og produktdata. Workshopen kopierer eller viser ingen bilder, priser eller
  produktoppføringer.
- Verifiserte GET-endepunkter:
  <https://api.sampleapis.com/beers/stouts> og
  <https://api.sampleapis.com/beers/red-ale> svarte 200 med ikke-tomme JSON-arrays.
  `ale` ble også undersøkt, men samlingen var bred og inneholdt innsendte
  øvingsdata av ulik form. Vi bruker ikke produktnavn for å gjette stil.
- Tjenesten tillater andre brukere å endre data, og data nullstilles jevnlig.
  Klienten sjekker derfor at hver valgt samling er en ikke-tom array, og
  videreformidler ikke innholdet til skjemaet.

**Eksplisitt tilpasning:** API-et har ølkategorier som egne ressurser, ikke en
komplett, strukturert stilkatalog eller et `/beer-types`-endepunkt. Vår
`BeerTypesClient` henter de to avtalte kategorisamlingene, bekrefter at de er
tilgjengelige og returnerer våre stabile ID-er og etiketter «Stout» og «Red ale».
Listen over kategorier og etikettene er altså en lokal mapping; eksterne kall
bekrefter kategoriene, men oppdager ikke nye stiler automatisk.

Dette oppfyller workshopens behov for et lite, eksternt støttet typevalg uten
å framstille datakilden som noe den ikke er. Ingen skriving sendes til det
åpne API-et. Det skjer to sekvensielle GET-kall per henting, med åtte sekunders
timeout hver. Omtrent ti kodegrupper gir en beskjeden kallmengde. Ingen
automatisk retry eller polling kjøres.

**Drift under samlingen:** En eksplisitt `--BeerTypes:Offline true` gir samme
to lokalt definerte kategorier og synlig kildemerking i UI-et. Vi lagrer ingen
kopi av produktdata. Feil og forsinkelse i fordypningene simuleres i klienten
før datamodus velges, så utprøving ikke avhenger av tilfeldige eksterne feil.
Live-integrasjonen er teknisk prøvd gjennom begge .NET-backender, se
[verifikasjonen](verifikasjon.md).

### Vurdert: Open Brewery DB

[Dokumentasjonen](https://www.openbrewerydb.org/documentation) beskriver bryggerier
og `brewery_type` som `micro`, `brewpub` og `regional`. Dette er **bryggerityper**,
ikke ølstiler, og ville gitt feil mening i skjemaet. Derfor ikke valgt.

### Vurdert: historisk Punk API

Det kjente `https://api.punkapi.com/v2/beers` lot seg ikke hente under
undersøkelsen. Vi baserer ikke oppstarten på en historisk tjeneste som ikke
kunne bekreftes tilgjengelig. Det er ikke brukt i koden.
