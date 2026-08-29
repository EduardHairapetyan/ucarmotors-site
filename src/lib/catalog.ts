import { getCollection, type CollectionEntry } from 'astro:content';

export type Car = CollectionEntry<'cars'>;

/**
 * The trust gate.
 *
 * A model appearing in the catalogue is low-risk: Ucar's own marketing
 * confirms they sell it. A *price* is high-risk — a wrong number on a
 * 10-million-dram car is a real problem for the dealership.
 *
 * So an unverified record still gets a page, but its price is withheld and
 * the car reads as "price on request". Flipping `verified: true` in the CMS
 * is what publishes the number.
 */
export function priceOf(car: Car): number | null {
  return car.data.verified ? car.data.priceAmd : null;
}

/** Sorted: priced cars first (cheapest up), then by brand. */
export async function getCars(): Promise<Car[]> {
  const cars = await getCollection('cars', ({ data }) => data.status !== 'sold');
  return cars.sort((a, b) => {
    const pa = priceOf(a);
    const pb = priceOf(b);
    if (pa !== null && pb !== null) return pa - pb;
    if (pa !== null) return -1;
    if (pb !== null) return 1;
    return `${a.data.brand}${a.data.model}`.localeCompare(`${b.data.brand}${b.data.model}`);
  });
}

export async function getFeatured(limit = 3): Promise<Car[]> {
  const cars = await getCars();
  const picked = cars.filter((c) => c.data.featured);
  return (picked.length ? picked : cars).slice(0, limit);
}

/** Longest range in the catalogue — the range bar is relative to the fleet. */
export function maxRange(cars: Car[]): number {
  return cars.reduce((max, c) => Math.max(max, c.data.rangeKm ?? 0), 0);
}

export function brandsOf(cars: Car[]): string[] {
  return [...new Set(cars.map((c) => c.data.brand))].sort((a, b) => a.localeCompare(b));
}

/** Cheapest monthly-eligible price, for the hero's "from" figure. */
export function entryPrice(cars: Car[]): { car: Car; price: number } | null {
  for (const car of cars) {
    const p = priceOf(car);
    if (p !== null) return { car, price: p };
  }
  return null;
}
