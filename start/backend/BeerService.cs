namespace Brewery;

public sealed class BeerService(BeerDatabase database, ILogger<BeerService> logger)
{
    public Beer Create(CreateBeer beer)
    {
        try
        {
            // Oppgave 2a: Tolk bare den kjente unikhetsfeilen her.
            return database.Insert(beer);
        }
        catch (Exception exception)
        {
            // Oppgave 3: Hva oppnår denne catch-blokken?
            logger.LogError(exception, "Lagring feilet");
            throw;
        }
    }
}
