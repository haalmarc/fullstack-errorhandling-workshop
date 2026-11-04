using Microsoft.Data.Sqlite;

namespace Brewery;

public sealed class BeerService(BeerDatabase database)
{
    public Beer Create(CreateBeer beer)
    {
        try
        {
            return database.Insert(beer);
        }
        catch (SqliteException exception) when (BeerDatabase.IsBeerNameConflict(exception))
        {
            // Teknisk detalj tolkes der vi kjenner skjemaet. Ukjente feil går videre.
            throw new DuplicateBeerException(exception);
        }
    }
}
