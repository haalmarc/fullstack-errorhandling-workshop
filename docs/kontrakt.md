# Feilkontrakten

Hovedoppgavene bruker RFC 9457 Problem Details med `application/problem+json`.
`errors` og `traceId` er våre utvidelser; RFC-en definerer ikke feltfeilformatet.
Feltidentifikatorene følger JSON-/skjemanavn: `name`, `beerType`, `abv`.

| Tilfelle | HTTP | `type` | Handling i React |
| --- | --- | --- | --- |
| Lagret | 201 + `Location` | – | Kvittering og reset |
| Ugyldig skjemaverdi | 400 | `urn:brewery:problem:validation` | Knytt `errors` til feltene |
| Opptatt navn i bryggeriet | 409 | `urn:brewery:problem:duplicate-beer` | Feltfeil på `name` |
| Uventet feil | 500 | `urn:brewery:problem:unexpected` | Fellesmelding med `traceId` |
| Ingen respons / uventet format | Varierer | Ukjent | Generell fallback, behold innhold |

## Feltfeil

```json
{
  "type": "urn:brewery:problem:validation",
  "title": "Kontroller feltene i skjemaet.",
  "status": 400,
  "errors": {
    "name": ["Skriv inn et navn."],
    "abv": ["Alkoholprosent må være mellom 0 og 20."]
  }
}
```

Duplikat bruker samme `errors`-struktur og annen type/status. Det lar React
gjenbruke feltkoblingen. Feilen betyr en konflikt med eksisterende tilstand,
selv om brukeren retter den gjennom et felt. 422 kan også brukes for semantisk
ugyldige verdier; her velges ASP.NETs standard 400 for å holde kjernen liten.

## Uventet feil

```json
{
  "type": "urn:brewery:problem:unexpected",
  "title": "Vi kunne ikke behandle forespørselen.",
  "status": 500,
  "detail": "Dette skyldes en feil hos oss. Innholdet i skjemaet er beholdt.",
  "traceId": "ea688b6f41a663fb9926e522fdbb5421"
}
```

Referansen legger samme `traceId` på alle Problem Details-responser gjennom
`CustomizeProblemDetails`. Den hentes fra `Activity.Current.TraceId`, med
`HttpContext.TraceIdentifier` som fallback. Den uventede feilen logges med den
samme verdien. Rammeverket kan ellers legge til hele Activity-ID-en i feltet
`traceId`; tilpasningen sikrer at respons og vår logg bruker samme format.

`type` er en stabil URI-identitet (URN her), `title` en lesbar oppsummering og
`detail` opplysninger om forekomsten. Ingen logikk skal avhenge av ordlyden.
React bruker HTTP-status som autoritet og sjekker samsvar med `status` i body.
Referansens parser krever `type`, `title` og `status` som del av **vår** kontrakt;
RFC-en tillater at disse utelates. Andre gyldige Problem Details-varianter kan
derfor havne i vår generelle fallback.

Tekst fra vilkårlige feilresponser, HTML eller exception-meldinger vises ikke
direkte. Kjente feltfeil får våre norske tekster; serverfeil får klientens trygge
fellesmelding og eventuell referanse. Detaljer forblir i backendloggen.

I kjernen er tall i gyldig JSON allerede bundet til DTO-en. Manglende/`null`
alkoholprosent inngår i feltvalideringen. Uleselig JSON eller en tekststreng der
DTO-en forventer et tall håndteres av rammeverket; den skal i det minste gi en
synlig klientfallback. Mer presis mapping av bindingsfeil kan utforskes senere.
