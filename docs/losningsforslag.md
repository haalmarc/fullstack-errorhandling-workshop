# Løsningsforslag og avveininger

Løsningsforslaget dekker kjernen. Fordypningene er åpne oppgaver og er ikke ferdig
implementert. Kjør løsningsforslaget som beskrevet i [oppstart](oppstart.md).

## 1. Feltvalidering

Filer:

- [`BeerEndpoints.cs`](../losningsforslag/backend/BeerEndpoints.cs)
- [`api.ts`](../losningsforslag/frontend/api.ts)
- [`useRegistration.ts`](../losningsforslag/frontend/useRegistration.ts)

Reglene er allerede samlet i `BeerRules.Validate`. Endepunktet gir 400 med
`Results.ValidationProblem`. React leser en kjent kontrakt og bruker `setError`
for kjente feltnavn. Første felt med feil får fokus. Kun bekreftet suksess
utløser `reset`; `clearErrors` rydder gamle feil før neste innsending.

Det er med vilje ingen klientregler som stopper innsendingen før serveren.
Da ser gruppa hele feilkjeden. I et vanlig produkt kan samme enkle regler i
klienten gi raskere tilbakemelding, men de erstatter ikke servervalideringen.

`errors` er ASP.NETs feltfeilutvidelse, ikke et felt definert i RFC 9457.
Objektnøklene er avtalt som JSON-navn. Det er derfor React ikke bruker C#-navnet
`Name`. Formfeltene og tilgjengelig feilvisning er ferdig oppkoblet for å holde
oppgaven rettet mot feilformidling.

## 2. Duplikat

Filer:

- [`BeerDatabase.cs`](../shared/backend/BeerDatabase.cs)
- [`BeerService.cs`](../losningsforslag/backend/BeerService.cs)
- [`BeerEndpoints.cs`](../losningsforslag/backend/BeerEndpoints.cs)

INSERT forsøkes uten en «finnes fra før?»-sjekk. SQLite er siste autoritet, også
ved samtidige innsettinger. Unikhetskravet er `(brewery_id, normalized_name)`.
Normalisering er trim, Unicode Form C og invariant store bokstaver. Vi kollapser
ikke mellomrom inne i navn eller gjør språkspesifikk navnesammenligning. Dette
er en avgrenset workshopregel, ikke en universell navnepolicy.

`IsBeerNameConflict` krever både hovedkode 19, utvidet kode 2067 og de konkrete
kolonnene i denne begrensningen. Dette er bevisst snevrere enn «constraint-feil».
Microsoft.Data.Sqlite tilbyr ikke et eget strukturert navn på den utløste unike
indeksen. Meldingssjekken er derfor bundet til vårt skjema og bibliotek og
etterprøves mot ekte SQLite. Ved skjema-/leverandørbytte må den vurderes igjen.

Tjenesten oversetter bare den kjente feilen til `DuplicateBeerException` og
beholder originalen som inner exception. Endepunktet oversetter domenefeilen
til HTTP 409 og `errors.name`. Denne forventede konflikten logges ikke som en
teknisk serverfeil. Andre databasefeil går videre til sentral håndtering.

Exceptions er valgt for en liten ryddeoppgave med lokale catch-blokker. Et
eksplisitt resultatobjekt for forventede feil er også et godt valg. Da skal
ukjente exceptions fortsatt ha en trygg, sentral fallback.

## 3. Uventede feil

Filer:

- [`Program.cs`](../losningsforslag/backend/Program.cs)
- [`UnexpectedExceptionHandler.cs`](../losningsforslag/backend/UnexpectedExceptionHandler.cs)
- [`useRegistration.ts`](../losningsforslag/frontend/useRegistration.ts)

En lokal catch beholdes når den tolker en kjent feil. Den brede «logg og kast
videre»-blokken fjernes fra tjenesten. Endepunktet beholder bare domenemapping.
`IExceptionHandler` håndterer uventede exceptions fra hele HTTP-kjeden, også
innlasting av øltyper. Den skriver trygg 500 og logger exception med sporings-ID.

`AddExceptionHandler` alene aktiverer ikke middleware; `UseExceptionHandler`
må også kalles. `AddProblemDetails` registrerer støtten. `UseStatusCodePages`
gir Problem Details også for tomme feilstatuser, men fanger ikke exceptions.
Det er ikke nødvendig å skrive en egen JSON-serialisator.

I .NET 10 undertrykkes middleware-diagnostikk som standard når en
`IExceptionHandler` returnerer `true`. Løsningsforslaget eier derfor én eksplisitt
feillogg i handleren og beholder standarden. Å skru av denne undertrykkingen
uten å endre loggansvaret kan gi dobbel logging. Respons og logg bruker samme
`Activity.TraceId`; `CustomizeProblemDetails` sikrer formatet gjennom
rammeverkets Problem Details-tjeneste.

Klienten viser sin egen fellesmelding og referansen, ikke rå `detail` fra
vilkårlige feil. Sporings-ID er til oppslag, ikke en forklaring brukeren kan
rette. Vi logger ikke hele request-body med brukerens verdier for å demonstrere
korrelasjon. Full distribuert sporing er ikke nødvendig her.

## 4. Frontend-fallback

Filer:

- [`api.ts`](../losningsforslag/frontend/api.ts)
- [`useRegistration.ts`](../losningsforslag/frontend/useRegistration.ts)

`fetch` kan lykkes som Promise selv når HTTP-status er 500. `response.ok`
sjekkes først. Ved feil godtas Problem Details bare med riktig medietype,
lesbar JSON og vår avtalte struktur. Parsingfeil går samme vei som
nettverksfeil. Ukjente felt gir synlig fellesmelding; vi lar ikke tilfeldige
JSON-nøkler bli skjemafelter. Ekstra, ukjente utvidelser ignoreres.

Suksess valideres også: 201 og et ølobjekt. En proxy med en 200 HTML-side eller
den opprinnelige `200 { message: ... }` skal ikke gi falsk kvittering. Fallbacken
lover ikke at lagringen er uteblitt, og anbefaler å sjekke listen før ny
innsending. Timeout, automatisk retry og idempotens er egne fordypninger.

## Ved ulik progresjon

Dere kan prioritere én side uten å finne opp ny infrastruktur:

- **Vil dere prioritere React?** Kjør løsningsforslagets backend med startfrontend.
  Dere får ferdig 400/409/500-kontrakt og kan gjøre frontendstegene i rekkefølge.
- **Vil dere prioritere backend?** Kjør startbackend med løsningsforslagets frontend.
  Backendstegene blir synlige i et UI som allerede forstår kontrakten.
- **Vil dere hoppe videre etter feltfeil?** Sammenlign bare
  `BeerService.cs` og duplikat-catch i løsningsforslagets `BeerEndpoints.cs`. Skriv
  disse delene inn i startkoden og gå videre til oppgave 3. Unngå å kopiere hele
  endepunktfilen før handleren er registrert.
- **Vil dere ta et nytt steg fra fullt løsningsforslag?** Kjør både backend og frontend fra løsningsforslaget
  og velg én oppgave i fordypningen. Rediger da `losningsforslag/` og eventuell
  delt innlastingskode.

Felles infrastruktur ligger i `shared/` for å unngå to konkurrerende kopier
av skjema, databasen og debugstøtten. Delt kode avhenger av den valgte
`BeerService`; frontend velges via Vites alias `@workshop`. Oppgavene gjør
normalt bare endringer i de små `start/`-filene.

## Etterprøving uten å skrive nye tester

Bruk [testmatrisen](verifikasjon.md), Network og logg. Et ferdig løsningsforslag er
et eksempel på én fungerende avveining, ikke en kontrakt alle produkter bør
kopiere. Sammenlign spesielt 400/422, exceptions/resultattyper, plassering av
tekster og hva dere gjør ved ukjent lagringsresultat.
