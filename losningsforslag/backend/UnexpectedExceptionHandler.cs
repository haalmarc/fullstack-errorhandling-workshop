using System.Diagnostics;
using Microsoft.AspNetCore.Diagnostics;

namespace Brewery;

public sealed class UnexpectedExceptionHandler(ILogger<UnexpectedExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception,
        CancellationToken cancellationToken)
    {
        var traceId = Activity.Current?.TraceId.ToString() ?? context.TraceIdentifier;
        logger.LogError(exception, "Uventet feil på {Method} {Path}. TraceId={TraceId}",
            context.Request.Method, context.Request.Path, traceId);
        // .NET 10 undertrykker middleware-diagnostikk for håndterte exceptions.
        // Her eier handleren loggingen; vi logger ikke samme feil i tjeneste og endepunkt.
        await Results.Problem(statusCode: 500,
            type: "urn:brewery:problem:unexpected",
            title: "Vi kunne ikke behandle forespørselen.",
            detail: "Dette skyldes en feil hos oss. Innholdet i skjemaet er beholdt.",
            extensions: new Dictionary<string, object?> { ["traceId"] = traceId }).ExecuteAsync(context);
        return true;
    }
}
