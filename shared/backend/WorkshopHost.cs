namespace Brewery;

public static class WorkshopHost
{
    public static WebApplicationBuilder CreateBuilder(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args.Where(a => a != "--reset-db").ToArray());
        builder.WebHost.UseUrls(builder.Configuration["urls"] ?? "http://localhost:5050");
        builder.Services.AddSingleton<BeerDatabase>();
        builder.Services.AddScoped<BeerService>();
        builder.Services.AddHttpClient<BeerTypesClient>(client =>
        {
            client.BaseAddress = new Uri("https://api.sampleapis.com/");
            client.Timeout = TimeSpan.FromSeconds(8);
        });
        return builder;
    }

    public static bool Initialize(WebApplication app, string[] args)
    {
        var reset = args.Contains("--reset-db");
        app.Services.GetRequiredService<BeerDatabase>().Initialize(reset);
        return reset;
    }

    public static void MapCommonEndpoints(WebApplication app)
    {
        app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
        app.MapGet("/api/beers", (BeerDatabase database) => database.List());
        app.MapGet("/api/beers/{id:long}", (long id, BeerDatabase database) =>
            database.List().FirstOrDefault(b => b.Id == id) is { } beer
                ? Results.Ok(beer) : Results.NotFound());
        app.MapGet("/api/beer-types", async (HttpContext context, BeerTypesClient client) =>
        {
            var fault = app.Environment.IsDevelopment() ? context.Request.Query["fault"].ToString() : null;
            return Results.Ok(await client.Get(fault, context.RequestAborted));
        });
        if (app.Environment.IsDevelopment())
        {
            app.MapPost("/api/debug/reset", (BeerDatabase database) =>
            {
                database.Initialize(reset: true);
                return Results.NoContent();
            });
        }
    }
}
