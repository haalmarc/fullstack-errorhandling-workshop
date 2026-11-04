using Brewery;

var builder = WorkshopHost.CreateBuilder(args);
var app = builder.Build();
if (WorkshopHost.Initialize(app, args)) return;
WorkshopHost.MapCommonEndpoints(app);
BeerEndpoints.Map(app);
app.Run();
