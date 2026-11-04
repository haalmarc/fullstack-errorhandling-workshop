# Verifikasjon og utprøving

## Teknisk verifisert 3. november 2026

Kjørt lokalt på macOS ARM64 med .NET SDK **10.0.402**, runtime **10.0.13**,
Node **26.12.1**, npm **11.20.0** og Playwright Chromium **156.0.8078.4**.
Ren `npm ci`, bygg av begge frontender og parsertester ble også kjørt med
**Node 24.22.2** på samme maskin. Det er ikke en test på en annen maskin.

| Sjekk | Resultat |
| --- | --- |
| `dotnet build start/backend` | Bestått, ingen advarsler eller feil |
| `dotnet build losningsforslag/backend` | Bestått, ingen advarsler eller feil |
| `npm run build` | TypeScript-sjekk og produksjonsbygg for start og løsningsforslag bestått |
| `npm test` | 9 tester bestått: feltkontrakt, ugyldig struktur, HTML, tom/uleselig JSON, mismatchet status, falsk kvittering og nettverksbrudd |
| `npm run check:api` | Begge API-er og løsningsforslag i Production bestått |
| `npm run check:api -- --live` | Samme sjekker bestått med ekte eksterne kall fra begge backender |
| `npm run test:e2e` | 11 tester av løsningsforslaget bestått, 1 startspesifikk test hoppet over som tilsiktet |
| `WORKSHOP_VARIANT=start npm run test:e2e` | 2 starttester bestått, 10 tester kun for løsningsforslaget hoppet over som tilsiktet |
| `--reset-db` via `dotnet run` | Begge varianter oppretter/nullstiller databasen og avslutter |

Starttestene etterprøver at gyldig registrering virker og at den tilsiktede
valideringsmangelen faktisk er observerbar. Testene av løsningsforslaget tester kravene
til sluttresultatet. De er ikke ment som en testpakke som skal være grønn etter
hvert uferdige oppgavesteg.

API-sjekkene starter egne serverprosesser og bruker faktiske HTTP-kall og ekte
SQLite-filer, uten Docker eller testdatabaseerstatning. De bekrefter:

- 201 med kvittering, `Location` og hentbart lagret øl.
- 400 med riktig medietype og feltfeil, inkludert `null`, navnelengde og
  alkoholgrenser 0 og 20.
- Faktisk SQLite-unikhetsfeil i startkoden og oversettelse til 409 i løsningsforslaget.
  Trim og ulik bokstavstørrelse behandles som samme navn.
- To samtidige forsøk på samme navn gir én 201 og én 409.
- En annen ekte SQLite-feil gir sentral, trygg 500. Teknisk årsak finnes i
  loggen, og responsens `traceId` finnes i nøyaktig én av våre feillogger.
- HTML-respons, brudd før lagring og brudd etter lagring kan gjenskapes.
- Reset gir nøyaktig startdata. Debug-endepunktet er borte, og feilheaderen
  ignoreres i Production.
- Ekstern 404 gir foreløpig trygg sentral 500; bevisst videre mapping er en
  fordypningsoppgave.

Nettlesertestene bruker virkelig React, Minimal API og SQLite for suksess,
feltfeil, duplikat, serverfeil og debugbrudd. De sjekker beholdte verdier,
fokus, retting og ny innsending. Et helt avvist nettverkskall samt uleselige og
ukjente kontrakter prøves også med Playwrights nettverksstyring.
`ECONNRESET` i Vite-loggen under bruddtestene er den tilsiktede simuleringen;
den lokale proxyen kan gjøre backendbrudd om til en tom HTTP 500. Den separate
nettverksavvisningstesten dekker tilfellet uten HTTP-respons.

Første backendbygg avdekket en sårbar eldre transitive SQLite-binærpakke.
Prosjektene bruker nå eksplisitt `SQLitePCLRaw.bundle_e_sqlite3` **3.0.5** og
`Microsoft.Data.Sqlite` **10.0.13**; bygg med advarsler som feil passerer.
`npm ci` rapporterte ingen kjente sårbarheter ved verifikasjonen.

## Kort manuell matrise for kodegruppa

| Gjør dette | Forvent etter ferdig kjerne |
| --- | --- |
| Nytt navn, type valgt, 4,7 % | Kvittering, nytt øl i liste, reset |
| Tomt navn, type valgt | 400, feil ved navn, øvrige verdier beholdes |
| Navn utfylt, 21 % | 400, feil ved alkohol, navn/type beholdes |
| ` kodepils ` | 409, navnefeltfeil, alle verdier beholdes |
| Gyldig skjema + uventet SQLite-feil | Trygg fellesfeil, referanse finnes i logg, ingen lagring |
| Gyldig skjema + HTML | Generell fallback, ingen rå HTML eller falsk suksess |
| Gyldig skjema + Offline | Generell fallback, beholdt innhold, aktiv knapp etterpå |
| Slå av feilen, rett verdier, send på nytt | Innsending lykkes; gammel feil er borte |
| Lagre, så bryt; oppdater listen | Fallback selv om ølet faktisk ble lagret (fordypning) |

## Ikke verifisert med mennesker ennå

### Oppstart på en annen maskin

La en kollega med fersk arbeidskopi følge bare [oppstart.md](oppstart.md).
Prøv gjerne Windows eller Linux, siden teknisk kjøring hittil er gjort på
macOS. Noter:

- Faktisk versjon av SDK, Node og npm, og tid fra start til gyldig innsending.
- Om `dotnet watch` og omstart ved C#-endringer er forståelig.
- Om offentlig pakkekilde og SampleAPIs er tilgjengelige fra jobbnettverket.
- Automatisk databaseopprettelse, startdata, restart uten datatap og begge
  nullstillingsmåtene.
- Om overgangen til lokal datamodus og til løsningsforslaget fungerer uten muntlig hjelp.

En lokal bygg- eller nettlesertest dokumenterer ikke denne opplevelsen.

### Progresjon i en representativ kodegruppe

La 2–3 personer med blandet React-/backendfordypning prøve materialet uten
forhåndsforklaring. Observer særlig:

- Får de til første responsendring raskt, og forstår de forskjellen før/etter?
- Klarer de å koble `errors.name` til feltet uten å lære React Hook Form først?
- Kan de forklare validering kontra duplikat før de går videre?
- Er overgangen fra lokale catch-blokker til handleren for stor i ett steg?
- Bruker de tiden på feilhåndtering framfor skjema, verktøy og aliasoppsett?
- Hvor langt kommer de etter 45, 60, 90 og 120 minutter? Når bruker de løsningsforslaget?

Noter steder de stopper, uventet tidsbruk og hva de faktisk kan forklare etterpå.
Juster terskelen i oppgave 1 og antall delsteg ut fra dette. Tidsanslagene er
foreløpige. Gruppene trenger ikke fullføre alt for å få et godt læringsutbytte.
