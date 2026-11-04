namespace Brewery;

public record CreateBeer(string? Name, string? BeerType, decimal? Abv);
public record Beer(long Id, int BreweryId, string Name, string BeerType, decimal Abv);
public record BeerType(string Id, string Name);
public record BeerTypesResponse(BeerType[] Items, string Source);

public static class BeerRules
{
    // Disse reglene er ferdige. Oppgavene handler om å formidle resultatet.
    public static Dictionary<string, string[]> Validate(CreateBeer beer)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(beer.Name))
            errors["name"] = ["Skriv inn et navn."];
        else if (beer.Name.Trim().Length > 80)
            errors["name"] = ["Navnet kan ha høyst 80 tegn."];
        if (beer.Abv is null or < 0 or > 20)
            errors["abv"] = ["Alkoholprosent må være mellom 0 og 20."];
        if (beer.BeerType is not ("stouts" or "red-ale"))
            errors["beerType"] = ["Velg en øltype fra listen."];
        return errors;
    }
}

public sealed class DuplicateBeerException(Exception inner)
    : Exception("Det finnes allerede et øl med dette navnet i bryggeriet.", inner);
