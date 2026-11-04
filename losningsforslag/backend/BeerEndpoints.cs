namespace Brewery;

public static class BeerEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/api/beers", async (CreateBeer beer, BeerService service,
            BeerDatabase database, HttpContext context) =>
        {
            var errors = BeerRules.Validate(beer);
            if (errors.Count > 0)
                return Results.ValidationProblem(errors,
                    title: "Kontroller feltene i skjemaet.",
                    type: "urn:brewery:problem:validation");
            try
            {
                if (await WorkshopFaults.BeforeSave(context, database)) return Results.Empty;
                var saved = service.Create(beer);
                if (WorkshopFaults.AfterSave(context)) return Results.Empty;
                return Results.Created($"/api/beers/{saved.Id}", saved);
            }
            catch (DuplicateBeerException)
            {
                return Results.ValidationProblem(
                    new Dictionary<string, string[]> { ["name"] = ["Bryggeriet har allerede et øl med dette navnet."] },
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Navnet er allerede i bruk.",
                    type: "urn:brewery:problem:duplicate-beer");
            }
        });
    }
}
