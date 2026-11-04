using System.Text;
using Microsoft.Data.Sqlite;

namespace Brewery;

public sealed class BeerDatabase(IWebHostEnvironment environment, IConfiguration configuration)
{
    // Hver backend har sin egen fil. DatabasePath brukes bare av verifikasjonsskriptet.
    private readonly string path = configuration["DatabasePath"]
        ?? Path.Combine(environment.ContentRootPath, "data", "brewery.db");

    private SqliteConnection Open()
    {
        var connection = new SqliteConnection(new SqliteConnectionStringBuilder
        {
            DataSource = path,
            Pooling = false
        }.ToString());
        connection.Open();
        return connection;
    }

    public void Initialize(bool reset = false)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
        using var connection = Open();
        using var command = connection.CreateCommand();
        command.CommandText = (reset ? "DROP TABLE IF EXISTS beers;" : "") + """
            CREATE TABLE IF NOT EXISTS beers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brewery_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                normalized_name TEXT NOT NULL,
                beer_type TEXT NOT NULL,
                abv REAL NOT NULL
            );
            CREATE UNIQUE INDEX IF NOT EXISTS ux_beers_brewery_name
                ON beers (brewery_id, normalized_name);
            INSERT OR IGNORE INTO beers (id, brewery_id, name, normalized_name, beer_type, abv)
                VALUES (1, 1, 'Kodepils', 'KODEPILS', 'stouts', 4.7);
            """;
        command.ExecuteNonQuery();
    }

    public Beer Insert(CreateBeer beer, int breweryId = 1)
    {
        using var connection = Open();
        using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO beers (brewery_id, name, normalized_name, beer_type, abv)
            VALUES ($brewery, $name, $normalized, $type, $abv)
            RETURNING id;
            """;
        var name = beer.Name!.Trim();
        command.Parameters.AddWithValue("$brewery", breweryId);
        command.Parameters.AddWithValue("$name", name);
        command.Parameters.AddWithValue("$normalized", Normalize(name));
        command.Parameters.AddWithValue("$type", beer.BeerType!);
        command.Parameters.AddWithValue("$abv", beer.Abv!.Value);
        var id = (long)command.ExecuteScalar()!;
        return new Beer(id, breweryId, name, beer.BeerType!, beer.Abv.Value);
    }

    public Beer[] List()
    {
        using var connection = Open();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT id, brewery_id, name, beer_type, abv FROM beers ORDER BY id";
        using var reader = command.ExecuteReader();
        var beers = new List<Beer>();
        while (reader.Read())
            beers.Add(new Beer(reader.GetInt64(0), reader.GetInt32(1), reader.GetString(2),
                reader.GetString(3), reader.GetDecimal(4)));
        return beers.ToArray();
    }

    public void CauseUnexpectedFailure()
    {
        using var connection = Open();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT missing_workshop_column FROM beers";
        command.ExecuteScalar(); // Ekte SQLite-feil, men IKKE en unikhetsfeil.
    }

    public static string Normalize(string name) =>
        name.Trim().Normalize(NormalizationForm.FormC).ToUpperInvariant();

    public static bool IsBeerNameConflict(SqliteException exception) =>
        exception.SqliteErrorCode == 19 && exception.SqliteExtendedErrorCode == 2067 &&
        exception.Message.Contains("UNIQUE constraint failed: beers.brewery_id, beers.normalized_name",
            StringComparison.Ordinal);
}
