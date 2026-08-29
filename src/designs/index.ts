/**
 * Design id → the components that make it.
 *
 * `Shell` wraps every page of that design (document, header, footer);
 * `Home` is bespoke per direction; `Card` is the design's unit of catalogue,
 * rendered by the shared `preview/Cars.astro` inside `gridClass`. The three
 * remaining pages — car, financing, contact — are shared markup that each
 * design re-skins through its own tokens, which is where the line between
 * "a direction" and "five separate sites" is drawn.
 */
import PlinthShell from './plinth/Shell.astro';
import PlinthHome from './plinth/Home.astro';
import PlinthCard from './plinth/Card.astro';

import StockbookShell from './stockbook/Shell.astro';
import StockbookHome from './stockbook/Home.astro';
import StockbookCard from './stockbook/Card.astro';

import DaylightShell from './daylight/Shell.astro';
import DaylightHome from './daylight/Home.astro';
import DaylightCard from './daylight/Card.astro';

import HighwayShell from './highway/Shell.astro';
import HighwayHome from './highway/Home.astro';
import HighwayCard from './highway/Card.astro';

import OvernightShell from './overnight/Shell.astro';
import OvernightHome from './overnight/Home.astro';
import OvernightCard from './overnight/Card.astro';

interface View {
  Shell: any;
  Home: any;
  Card: any;
  /** How that design shelves its catalogue. */
  gridClass: string;
}

export const views: Record<string, View> = {
  // A sequence, not a grid — each band is full measure.
  plinth: { Shell: PlinthShell, Home: PlinthHome, Card: PlinthCard, gridClass: 'flex flex-col' },
  // Rows of a table.
  stockbook: { Shell: StockbookShell, Home: StockbookHome, Card: StockbookCard, gridClass: 'flex flex-col gap-px bg-line' },
  // Soft tiles, generous gaps, no dividers.
  daylight: { Shell: DaylightShell, Home: DaylightHome, Card: DaylightCard, gridClass: 'grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3' },
  // A type index — full-width rows.
  highway: { Shell: HighwayShell, Home: HighwayHome, Card: HighwayCard, gridClass: 'flex flex-col' },
  // Conventional grid; the rail carries the money.
  overnight: { Shell: OvernightShell, Home: OvernightHome, Card: OvernightCard, gridClass: 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3' },
};
