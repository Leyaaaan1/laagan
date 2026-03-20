export const getRideTypeIcon = (riderType) => {
  switch (riderType) {
    case 'car':         return 'car';
    case 'motor':
    case 'Motorcycle':  return 'motorcycle';
    case 'bike':
    case 'Bicycle':     return 'bicycle';
    case 'cafe Racers': return 'rocket';
    default:            return 'user';
  }
};

// ── Selectable options list (used in CreateRide / RideStep1) ──────────────────
export const RIDE_TYPE_OPTIONS = [
  { type: 'car',         icon: 'car',        label: 'Car'         },
  { type: 'motor',       icon: 'motorcycle', label: 'Motorcycle'  },
  { type: 'run',         icon: 'user',       label: 'Run'         },
  { type: 'bike',        icon: 'bicycle',    label: 'Bike'        },
  { type: 'cafe Racers', icon: 'rocket',     label: 'Cafe Racers' },
];
