using System.Net;
using System.Text.Json;

namespace Brewery;

public sealed class BeerTypesClient(HttpClient http, IConfiguration configuration)
{
    public static readonly BeerType[] WorkshopTypes =
        [new("stouts", "Stout"), new("red-ale", "Red ale")];

    public async Task<BeerTypesResponse> Get(string? fault, CancellationToken cancellationToken)
    {
        // Simulering ved integrasjonsgrensen, ikke avhengig av tilfeldig ekstern nedetid.
        if (fault == "slow")
            await Task.Delay(TimeSpan.FromSeconds(4), cancellationToken);
        if (fault is "unavailable" or "not-found")
            throw new HttpRequestException("Simulert feil fra ølkatalogen.", null,
                fault == "not-found" ? HttpStatusCode.NotFound : HttpStatusCode.ServiceUnavailable);

        if (configuration.GetValue<bool>("BeerTypes:Offline"))
            return new(WorkshopTypes, "local");

        // SampleAPIs har kategorier, ikke et eget /styles-endepunkt. Vi bekrefter de to
        // valgte kategoriene mot faktiske, ikke-tomme samlinger. Ingen produktdata lagres.
        foreach (var type in WorkshopTypes)
        {
            using var response = await http.GetAsync($"beers/{type.Id}", cancellationToken);
            response.EnsureSuccessStatusCode();
            using var document = await JsonDocument.ParseAsync(
                await response.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
            if (document.RootElement.ValueKind != JsonValueKind.Array || document.RootElement.GetArrayLength() == 0)
                throw new JsonException("Ølkatalogen svarte ikke med en ikke-tom samling.");
        }
        return new(WorkshopTypes, "sampleapis");
    }
}
