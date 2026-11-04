import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createBeer } from './api';
import type { BeerInput, SaveFault } from '../../shared/frontend/types';

export function useRegistration(onSaved: () => void) {
  const form = useForm<BeerInput>({ defaultValues: { name: '', beerType: '', abv: 4.7 } });
  const [success, setSuccess] = useState('');
  async function submit(values: BeerInput, fault: SaveFault) {
    setSuccess('');
    form.clearErrors();
    try {
      await createBeer(values, fault);
      setSuccess('Ølet er registrert.');
      form.reset();
      onSaved();
    } catch (error) {
      // Oppgave 1c, 3c og 4: Feltfeil, trygg serverfeil og fallback har ulike behov.
      form.setError('root.server', { message: error instanceof Error ? error.message : 'Ukjent feil.' });
    }
  }
  return { form, success, submit };
}
