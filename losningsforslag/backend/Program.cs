using Brewery;
using System.Diagnostics;

var builder = WorkshopHost.CreateBuilder(args);
builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
    context.ProblemDetails.Extensions["traceId"] =
        Activity.Current?.TraceId.ToString() ?? context.HttpContext.TraceIdentifier);
builder.Services.AddExceptionHandler<UnexpectedExceptionHandler>();
var app = builder.Build();
if (WorkshopHost.Initialize(app, args)) return;
// Også i Development: vi vil prøve den trygge kontrakten i workshopen.
app.UseExceptionHandler();
app.UseStatusCodePages();
WorkshopHost.MapCommonEndpoints(app);
BeerEndpoints.Map(app);
app.Run();
