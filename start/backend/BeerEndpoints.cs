namespace Brewery;

public static class BeerEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/api/beers", async (CreateBeer beer, BeerService service,
            BeerDatabase database, HttpContext context, ILogger<BeerService> logger) =>
        {
            var errors = BeerRules.Validate(beer);
            if (errors.Count > 0)
            {
                // Oppgave 1a: Responsen skjuler at dette er en feil, og hvilket felt den gjelder.
                return Results.Ok(new { message = "Noe er feil i skjemaet." });
            }
            try
            {
                if (await WorkshopFaults.BeforeSave(context, database)) return Results.Empty;
                var saved = service.Create(beer);
                if (WorkshopFaults.AfterSave(context)) return Results.Empty;
                return Results.Created($"/api/beers/{saved.Id}", saved);
            }
            catch (Exception exception)
            {
                // Bevisst dårlig startkode, kun til lokal utprøving. Oppgave 2b og 3.
                logger.LogError(exception, "Registrering feilet");
                return Results.Json(new { message = exception.Message }, statusCode: 500);
            }
        });
    }
}
