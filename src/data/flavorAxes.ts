import { FlavorProfile } from '../types';

export const FLAVOR_AXES: (keyof FlavorProfile)[] = [
  'sweet',
  'oak',
  'vanilla',
  'caramel',
  'spice',
  'fruit',
  'floral',
  'smoke',
  'nutty',
  'earthy',
];

export const FLAVOR_LABELS: Record<keyof FlavorProfile, string> = {
  sweet: 'Sweetness',
  oak: 'Oak',
  vanilla: 'Vanilla',
  caramel: 'Caramel',
  spice: 'Spice',
  fruit: 'Fruit',
  floral: 'Floral',
  smoke: 'Smoke',
  nutty: 'Nutty',
  earthy: 'Earthy',
};
