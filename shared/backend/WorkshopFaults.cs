namespace Brewery;

public static class WorkshopFaults
{
    public static async Task<bool> BeforeSave(HttpContext context, BeerDatabase database)
    {
        if (!context.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            return false;
        switch (context.Request.Headers["X-Workshop-Fault"].ToString())
        {
            case "server":
                database.CauseUnexpectedFailure();
                break;
            case "html":
                context.Response.StatusCode = 502;
                context.Response.ContentType = "text/html";
                await context.Response.WriteAsync("<html><body>Proxy could not reach upstream</body></html>");
                return true;
            case "disconnect":
                context.Abort();
                return true;
            case "slow-save":
                await Task.Delay(TimeSpan.FromSeconds(6), context.RequestAborted);
                break;
        }
        return false;
    }

    public static bool AfterSave(HttpContext context)
    {
        if (context.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment() &&
            context.Request.Headers["X-Workshop-Fault"] == "saved-disconnect")
        {
            context.Abort();
            return true;
        }
        return false;
    }
}
