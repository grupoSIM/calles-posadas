import { getStreetBySlug } from './db/streets';

export function getStreetMetadata(slug: string) {
  const street = getStreetBySlug(slug);

  if (!street) {
    return {
      title: 'Calle no encontrada — Calles de Posadas',
    };
  }

  return {
    title: `${street.official_name} — Calles de Posadas`,
    description: street.explanation || `Ficha técnica e información vial de ${street.official_name} en Posadas, Misiones.`,
  };
}
