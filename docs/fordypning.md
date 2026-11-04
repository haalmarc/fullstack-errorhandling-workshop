# Fordypning

Velg én oppgave når kjernen virker. De kan løses fra startkoden dere har
forbedret, eller fra fullt løsningsforslag. Debugstøtten finnes allerede; løsningene
under er åpne og inngår ikke i løsningsforslaget.

👉 markerer oppgaver, 💡 refleksjon, ✅ ferdigkriterier og 📖 lesestoff.

## A. Stabile feilkoder og språk · 15–25 minutter

**Mål:** Endre brukertekst uten å endre feilidentiteten.

### 👉 Oppgave

1. Begynn med bare navnekonflikten. Legg til `code: "beer.name_taken"` som
   Problem Details-utvidelse. Behold `type`, status og `errors` så andre klienter
   fortsatt forstår responsen.
2. Lag en norsk og en engelsk språkressurs i frontend, og slå opp teksten fra
   koden. Bytt språk og utløse samme duplikat på nytt.
3. Utvid eventuelt én valideringsregel med kode og parametere, for eksempel
   `beer.abv_out_of_range`, `{ min: 0, max: 20 }`. Avtal hvordan dette knyttes
   til feltene; ikke la tekster være maskinidentifikatorer.
4. Prøv en kode frontend ikke kjenner. Sørg for en trygg fallback.

**✅ Ferdig når:** Samme feilidentitet gir tekst på to språk, og ukjent kode
fortsatt gir en synlig feil.

**💡 Drøft alternativet:** La backend velge tekst etter `Accept-Language`.
Vanlig `Accept` gjelder responsformat. Hva passer best når flere klienter
bruker samme API? Hvem kjenner brukerens kontekst, og hvordan håndteres
utrulling av nye koder og språkressurser? Det finnes ikke ett riktig sted
for alle feiltekster.

**📖 Lesestoff:** [RFC 9457 §3](https://www.rfc-editor.org/rfc/rfc9457.html#section-3),
[Accept-Language](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.4).

## B. Feil og venting ved innlasting · 15–25 minutter

**Mål:** Skjemaet skal ikke fremstå klart når nødvendige øltyper mangler.

Startsted: `shared/frontend/App.tsx`, `catalog.ts` og `BeerTypesClient.cs`.
Det finnes en enkel innlastingsfeil og ny henting i debugpanelet, men
skjemaet er fortsatt aktivt når typene mangler, og ingen tydelig ventetilstand
finnes. Løsningsforslaget beholder denne mangelen for oppgaven.

### 👉 Oppgave

1. Velg fire sekunders forsinkelse og hent typene på nytt. Observer om gamle
   data fortsatt ser klare ut. Velg deretter ekstern 503.
2. Legg til eksplisitte tilstander: laster, klar og feil. Deaktiver innsending
   når nødvendige typer mangler. Behold øvrig skjemainnhold.
3. Gi brukeren en vanlig «Hent øltyper på nytt»-knapp ved feilen, uten å måtte
   åpne debugpanelet. Prøv først med feil, deretter uten.
4. Prøv to raske hentinger med ulik forsinkelse. Kan et gammelt svar overskrive
   det nyeste? Bruk eventuelt `AbortController` eller en forespørsels-ID.

**✅ Ferdig når:** Venting er synlig, manglende data blokkerer meningsløs
innsending, ny henting virker og navn/alkohol beholdes.

**💡 Drøft:** Bør gamle typer være brukbare mens oppdatering feiler? Hvordan
vises forskjellen mellom «ingen typer finnes» og «vi klarte ikke å hente»?

**📖 Lesestoff:** [React useEffect, race conditions](https://react.dev/reference/react/useEffect#fetching-data-with-effects),
[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

## C. Oversett feil fra ekstern tjeneste · 15–25 minutter

**Mål:** Vårt API skal beskrive betydningen for vår klient.

### 👉 Oppgave

1. Velg ekstern 404 i debugpanelet. I dagens løsningsforslag blir dette en uventet
   500 fra sentral handler. Les loggen. Simuleringen ligger ved integrasjonsgrensen
   før lokal datamodus, så den kan prøves uten internett.
2. Avgjør betydningen: Her er det en **påkrevd, kjent kategori** som mangler,
   ikke et søk uten treff. Bør det være 502, 503 eller en annen respons? Lag en
   liten feiltype for akkurat den betydningen i klient-/tjenestelaget.
3. Oversett den til vår egen Problem Details-type. Ikke videresend ekstern
   HTML, vertsnavn eller statuskode automatisk. La uventede feil gå til sentral
   fallback. Avtal hvilket lag som logger den oversatte feilen.
4. Prøv ekstern 503 og eventuell timeout. Vurder om det er samme betydning
   for React og samme ansvar for retry.

**✅ Ferdig når:** React får vår kontrakt og en nyttig innlastingsfeil, mens
backendloggen gir teknisk årsak. Forklar hvorfor ekstern 404 ikke ble vår 404.

**💡 Sammenlign:** Hvis dette var et søk, kunne 404 hos leverandøren betydd «ingen
treff» og blitt `200 []` hos oss? Når ville det skjult et reelt problem?

**📖 Lesestoff:** [HTTP 502, 503 og 504](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.6.3),
[HttpRequestException.StatusCode](https://learn.microsoft.com/en-us/dotnet/api/system.net.http.httprequestexception.statuscode?view=net-10.0).

## D. Retry og usikkert lagringsresultat · 20–30 minutter

**Mål:** Skille mellom «forespørselen feilet» og «lagringen skjedde ikke».

### 👉 Oppgave

1. Velg **Lagre, så bryt forbindelsen**, send et nytt navn, og les meldingen.
   Trykk **Oppdater listen**. Ølet finnes selv om innsendingen ikke fikk svar.
2. Velg «Ingen» og send samme skjema igjen. Nå får dere duplikat. Er det god
   nok hjelp til å avgjøre om forrige innsending ble riktig lagret?
3. Legg eventuelt en klienttimeout med `AbortController` rundt POST. Bruk
   seks sekunders forsinkelse i panelet. Ikke legg inn automatisk retry ennå.
   Abort hos klienten er ikke en garanti for rollback på serveren. Denne
   forsinkelsen respekterer cancellation før INSERT; «lagre, så bryt» viser
   det andre utfallet.
4. Lag en manuell retry for **GET av øltyper**, med ventetilstand og grense for
   antall forsøk. Hvorfor er det mindre risikabelt enn automatisk retry av POST?
5. Skisser eller implementer idempotens for POST: klienten lager en nøkkel per
   logiske registrering og gjenbruker den ved retry. Serveren lagrer nøkkel,
   innholdsfingeravtrykk og resultat atomisk med ølet. Samme nøkkel med annet
   innhold må ikke tolkes som samme operasjon.

**✅ Ferdig når:** Dere kan vise både brudd før og etter lagring, og forklare
hvorfor ingen av dem kan skilles sikkert bare fra en `fetch`-feil. En skisse
med transaksjonsgrense og retrybeslutning er et godt resultat.

**💡 Drøft:** Unikt navn hindrer to identiske navn, men er det det samme som
idempotens? Hvor lenge lagres en idempotensnøkkel? Hvilke feil er midlertidige,
og hvilke vil gjenta seg uansett antall forsøk?

**📖 Lesestoff:** [RFC 9110 §9.2.2, idempotente metoder og retry](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2).

## E. Spor én forespørsel videre · 15–25 minutter

**Mål:** Se skillet mellom brukerreferanse, trace og enkeltspan.

### 👉 Oppgave

1. Utløs en serverfeil og slå opp UI-ets ID i loggen. Hva gjør dere hvis
   backend har flere instanser? Legg eventuelt til en strukturert logg-scope.
2. Inspiser `Activity.Current` rundt et eksternt HTTP-kall. Sammenlign trace-ID
   og span-ID. .NETs HTTP-instrumentering kan videreføre W3C-kontekst.
3. Legg til en egen `ActivitySource` rundt registrering eller ekstern henting,
   og en lokal listener for å se spanene. Full OpenTelemetry-innsamling er
   valgfritt og ikke nødvendig for å fullføre oppgaven.
4. Vurder hvilke felt som hjelper feilsøking uten å logge hele request-body.

**✅ Ferdig når:** Dere kan følge én forespørsel over minst to steg og forklare
hvorfor trace-ID og span-ID ikke er samme ting.

**💡 Drøft:** Hvem kan sende inn sporingskontekst? Er en trace-ID en hemmelighet,
en tilgangskontroll eller bare en korrelasjonsverdi? Hvordan beskytter dere
selve loggtilgangen?

**📖 Lesestoff:** [W3C Trace Context](https://www.w3.org/TR/trace-context/),
[.NET distributed tracing](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/distributed-tracing).
