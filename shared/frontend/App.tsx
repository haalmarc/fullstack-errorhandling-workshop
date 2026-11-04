import { useEffect, useState } from "react";
import { useRegistration } from "@workshop/useRegistration";
import { loadBeerTypes, resetDatabase } from "./catalog";
import type { Beer, BeerTypes, SaveFault } from "./types";

export function App() {
  const [catalog, setCatalog] = useState<BeerTypes>({ items: [], source: "" });
  const [catalogError, setCatalogError] = useState("");
  const [catalogFault, setCatalogFault] = useState("");
  const [fault, setFault] = useState<SaveFault>("");
  const [beers, setBeers] = useState<Beer[]>([]);
  const [listError, setListError] = useState("");
  const [debugMessage, setDebugMessage] = useState("");

  async function refreshBeers() {
    setListError("");
    try {
      const response = await fetch("/api/beers");
      if (!response.ok) throw new Error();
      setBeers(await response.json());
    } catch {
      setListError("Listen kunne ikke oppdateres.");
    }
  }
  async function refreshTypes(failure = "") {
    setCatalogError("");
    try {
      setCatalog(await loadBeerTypes(failure));
    } catch {
      setCatalog({ items: [], source: "" });
      setCatalogError(
        "Øltypene kunne ikke hentes. Se oppstartshjelpen eller prøv lokal datamodus.",
      );
    }
  }
  useEffect(() => {
    void refreshTypes();
    void refreshBeers();
  }, []);
  const { form, success, submit } = useRegistration(() => {
    void refreshBeers();
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <main>
      <header>
        <p className="eyebrow">React + .NET · Feilhåndtering</p>
        <h1>Bryggeriet</h1>
        <p>
          Registrer et øl i Kodebryggeriet. Navnet skal være unikt i bryggeriet.
        </p>
      </header>
      <div className="columns">
        <section aria-labelledby="register-heading">
          <h2 id="register-heading">Nytt øl</h2>
          <p>
            Navn: 1–80 tegn. Alkohol: 0–20 %. Startdata inneholder «Kodepils».
          </p>
          {catalogError && (
            <p role="alert" className="error">
              {catalogError}
            </p>
          )}
          {catalog.source && (
            <p className="source">
              Øltyper:{" "}
              {catalog.source === "local"
                ? "lokale workshopdata"
                : "SampleAPIs via backend"}
            </p>
          )}
          <form
            noValidate
            onSubmit={handleSubmit((values) => submit(values, fault))}
          >
            <label htmlFor="name">Navn</label>
            <input
              id="name"
              {...register("name")}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="error" role="alert">
                {errors.name.message}
              </p>
            )}
            <label htmlFor="beerType">Øltype</label>
            <select
              id="beerType"
              {...register("beerType")}
              aria-invalid={!!errors.beerType}
              aria-describedby={errors.beerType ? "type-error" : undefined}
            >
              <option value="">Velg øltype</option>
              {catalog.items.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.beerType && (
              <p id="type-error" className="error" role="alert">
                {errors.beerType.message}
              </p>
            )}
            <label htmlFor="abv">Alkoholprosent</label>
            <input
              id="abv"
              type="number"
              step="any"
              {...register("abv", { valueAsNumber: true })}
              aria-invalid={!!errors.abv}
              aria-describedby={errors.abv ? "abv-error" : undefined}
            />
            {errors.abv && (
              <p id="abv-error" className="error" role="alert">
                {errors.abv.message}
              </p>
            )}
            {errors.root?.server && (
              <p className="error" role="alert">
                {errors.root.server.message}
              </p>
            )}
            {success && (
              <p role="status" className="success">
                {success}
              </p>
            )}
            <button disabled={isSubmitting}>
              {isSubmitting ? "Registrerer …" : "Registrer øl"}
            </button>
          </form>
        </section>
        <section aria-labelledby="saved-heading">
          <h2 id="saved-heading">Registrerte øl</h2>
          <button
            type="button"
            className="secondary"
            onClick={() => void refreshBeers()}
          >
            Oppdater listen
          </button>
          {listError && (
            <p role="alert" className="error">
              {listError}
            </p>
          )}
          <ul>
            {beers.map((beer) => (
              <li key={beer.id}>
                <strong>{beer.name}</strong> · {beer.abv} % · {beer.beerType}
              </li>
            ))}
          </ul>
        </section>
      </div>
      {import.meta.env.DEV && (
        <details>
          <summary>Debugpanel for workshopen</summary>
          <p>
            Valget gjelder hver innsending til du velger «Ingen». Feltfeil og
            duplikat lager du i skjemaet.
          </p>
          <label htmlFor="fault">Feil ved innsending</label>
          <select
            id="fault"
            value={fault}
            onChange={(event) => setFault(event.target.value as SaveFault)}
          >
            <option value="">Ingen</option>
            <option value="server">Uventet SQLite-feil før lagring</option>
            <option value="html">HTML fra proxy (502)</option>
            <option value="disconnect">Forbindelsen brytes før lagring</option>
            <option value="slow-save">
              Seks sekunder før lagring (fordypning)
            </option>
            <option value="saved-disconnect">
              Lagre, så bryt forbindelsen (fordypning)
            </option>
          </select>
          <label htmlFor="catalog-fault">
            Innlasting av øltyper (fordypning)
          </label>
          <select
            id="catalog-fault"
            value={catalogFault}
            onChange={(event) => setCatalogFault(event.target.value)}
          >
            <option value="">Ingen</option>
            <option value="unavailable">Ekstern 503</option>
            <option value="not-found">Ekstern 404</option>
            <option value="slow">Fire sekunder forsinkelse</option>
          </select>
          <button
            className="secondary"
            onClick={() => void refreshTypes(catalogFault)}
          >
            Hent øltyper på nytt
          </button>
          <button
            className="secondary"
            onClick={async () => {
              setDebugMessage("");
              try {
                await resetDatabase();
                await refreshBeers();
                setDebugMessage("Databasen er nullstilt.");
              } catch (error) {
                setDebugMessage(
                  error instanceof Error
                    ? error.message
                    : "Nullstilling feilet.",
                );
              }
            }}
          >
            Nullstill database
          </button>
          <p role="status">{debugMessage}</p>
        </details>
      )}
    </main>
  );
}
