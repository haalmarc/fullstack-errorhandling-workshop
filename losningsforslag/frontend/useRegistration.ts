import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiProblem, createBeer } from './api';
import { fallbackMessage, type BeerInput, type SaveFault } from '../../shared/frontend/types';

const fields = ['name', 'beerType', 'abv'] as const;

export function useRegistration(onSaved: () => void) {
  const form = useForm<BeerInput>({ defaultValues: { name: '', beerType: '', abv: 4.7 } });
  const [success, setSuccess] = useState('');
  async function submit(values: BeerInput, fault: SaveFault) {
    setSuccess('');
    form.clearErrors();
    try {
      await createBeer(values, fault);
      setSuccess('Ølet er registrert.');
      form.reset(); // Bare ved bekreftet suksess.
      onSaved();
    } catch (error) {
      if (error instanceof ApiProblem) {
        const { problem, status } = error;
        if ((status === 400 && problem.type === 'urn:brewery:problem:validation') ||
            (status === 409 && problem.type === 'urn:brewery:problem:duplicate-beer')) {
          let fieldCount = 0;
          for (const field of fields) {
            const messages = problem.errors?.[field];
            if (messages?.length) {
              form.setError(field, { type: 'server', message: messages.join(' ') }, { shouldFocus: fieldCount === 0 });
              fieldCount++;
            }
          }
          // Ukjente feltnavn må ikke føre til at en feil blir usynlig.
          if (fieldCount > 0 && Object.keys(problem.errors ?? {}).every(k => fields.some(f => f === k))) return;
        }
        if (status >= 500) {
          form.setError('root.server', {
            message: `Vi kunne ikke behandle forespørselen. Innholdet er beholdt.${problem.traceId ? ` Referanse: ${problem.traceId}` : ''}`,
          });
          return;
        }
      }
      // Nettverksbrudd, HTML, tom respons, ugyldig JSON og ukjent kontrakt.
      form.setError('root.server', { message: fallbackMessage });
    }
  }
  return { form, success, submit };
}
