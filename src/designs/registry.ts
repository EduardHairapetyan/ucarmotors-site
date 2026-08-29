/**
 * The five design proposals.
 *
 * Metadata only — names, one-line theses, and the swatches the chooser page
 * paints. The look of a direction lives entirely in `src/designs/<id>/`, so
 * keeping one means deleting the other four folders and their entries here,
 * then folding the winner back into `src/components/views/`.
 */
export interface Design {
  id: string;
  name: string;
  /** One line: what this direction believes about selling an EV. */
  tagline: string;
  /** Three concrete differences, for the chooser card. */
  notes: string[];
  /** Colours painted as the card's header band, left to right. */
  swatches: string[];
}

export const designs: Design[] = [
  {
    id: 'plinth',
    name: 'Plinth',
    tagline: 'A car is sold by being looked at — one at a time, under good light.',
    notes: [
      'No grid. The catalogue is a vertical sequence, one car per band.',
      'Tri-script serif headlines; dark appears only behind photography.',
      'A gradient rail under the header fills as you move through the stock.',
    ],
    swatches: ['#FFFFFF', '#0C0D0F', '#3B4EE6', '#1FD1C1'],
  },
  {
    id: 'stockbook',
    name: 'Stock Book',
    tagline: 'A car is a line in a price list, and the price list is the product.',
    notes: [
      'The catalogue is a sortable table — compare twelve cars in one view.',
      'A row opens in place into its own payment calculator.',
      'Zero hairlines: rows separate by tint and weight, never by a rule.',
    ],
    swatches: ['#F2F3F5', '#EDF0FE', '#FFFFFF', '#3B4EE6'],
  },
  {
    id: 'daylight',
    name: 'Daylight',
    tagline: 'An EV is a consumer product; buying one should feel like an unpacking.',
    notes: [
      'Same palette, unrecognisable structure — soft edges, one radius, real air.',
      'The gradient appears only as blurred ambient light, never as a filled surface.',
      'One payment pill: the monthly figure, or “call”, in the same shape either way.',
    ],
    swatches: ['#F6F8FD', '#FFFFFF', '#3B4EE6', '#0F7A42'],
  },
  {
    id: 'highway',
    name: 'Highway Sign',
    tagline: 'You are a building on the Yerevan–Sevan highway. Behave like one.',
    notes: [
      'Built from type, colour and direction — the only photo-independent direction.',
      'The hero is a full-bleed gradient sign face carrying the headline.',
      'The catalogue is a type index: brand and model large, thumbnail secondary.',
    ],
    swatches: ['#1FD1C1', '#3B82F6', '#7C3AED', '#FFFFFF'],
  },
  {
    id: 'overnight',
    name: 'Overnight',
    tagline: 'The car charges while you sleep; the cost is a rhythm, not a price.',
    notes: [
      'A live monthly payment readout that follows you through the whole site.',
      'Dusk violet #161233 on the hero and the rail — not graphite, not black.',
      'Cards load themselves into the calculator without a page navigation.',
    ],
    swatches: ['#161233', '#1E1A42', '#7C3AED', '#34C77B'],
  },
];

export const designIds = () => designs.map((d) => d.id);
