// Map of rider types to icons
export const getRideTypeIcon = riderType => {
  if (!riderType) return 'motorcycle';

  const typeStr = String(riderType).toLowerCase();

  // Honda models
  if (
    [
      'adv 160',
      'cb150r',
      'cb400',
      'cb500f',
      'cbr150r',
      'cbr300r',
      'cbr600rr',
      'rs150r',
      'sonic 150r',
    ].includes(typeStr)
  ) {
    return 'motorcycle';
  }

  // Scooters/Mopeds
  if (
    [
      'pcx 160',
      'click 160',
      'click 125i',
      'beat',
      'wave 110',
      'forza 350',
    ].includes(typeStr)
  ) {
    return 'shield';
  }

  // Adventure/Trail
  if (['xr150l', 'crf150l', 'crf300l', 'adv 160'].includes(typeStr)) {
    return 'compass';
  }

  // Yamaha
  if (['aerox 155', 'nmax 155', 'mio gravis', 'mio i 125'].includes(typeStr)) {
    return 'heart';
  }

  // Default
  return 'motorcycle';
};

// Function to group rider types by manufacturer
export const groupRiderTypesByManufacturer = riderTypes => {
  const grouped = {
    Honda: [],
    Yamaha: [],
    Suzuki: [],
    Kawasaki: [],
    Other: [],
  };

  const hondaModels = [
    'ADV 160',
    'Beat',
    'CB150R',
    'CB400',
    'CB500F',
    'CBR150R',
    'CBR300R',
    'CBR600RR',
    'Click 125i',
    'Click 160',
    'CRF150L',
    'CRF300L',
    'Forza 350',
    'PCX 160',
    'RS150R',
    'Sonic 150R',
    'Tmx 125 Alpha',
    'Tmx Supremo',
    'Wave 110',
    'XR150L',
  ];
  const yamahaModels = [
    'Aerox 155',
    'FZ 150i',
    'FZ-S V3',
    'Mio Gravis',
    'Mio i 125',
    'Mio M3',
    'Mio Soul i 125',
    'MT-03',
    'MT-15',
    'NMAX 155',
    'R3',
    'R15 V4',
    'Sniper 150 MXi',
    'Sniper 155R',
    'Vixion R',
    'XSR 155',
    'Y16ZR',
  ];
  const suzukiModels = [
    'Address 115',
    'Burgman Street 125',
    'GSX-R150',
    'GSX-S150',
    'Raider J 115 Fi',
    'Raider R150 Fi',
    'Skydrive Sport 125',
    'Smash 115',
    'V-Strom 650',
  ];
  const kawasakiModels = [
    'Barako 175',
    'CT125',
    'KLX 150',
    'KLX 230',
    'Ninja 400',
    'Ninja 650',
    'Ninja ZX-6R',
    'Rouser NS160',
    'Rouser NS200',
    'W175',
    'Z400',
    'Z650',
  ];

  if (Array.isArray(riderTypes)) {
    riderTypes.forEach(type => {
      const typeName = type.riderType || type;
      if (hondaModels.includes(typeName)) {
        grouped['Honda'].push(type);
      } else if (yamahaModels.includes(typeName)) {
        grouped['Yamaha'].push(type);
      } else if (suzukiModels.includes(typeName)) {
        grouped['Suzuki'].push(type);
      } else if (kawasakiModels.includes(typeName)) {
        grouped['Kawasaki'].push(type);
      } else {
        grouped['Other'].push(type);
      }
    });
  }

  return grouped;
};

// Placeholder for ride type options (will be fetched from backend)
export const RIDE_TYPE_OPTIONS = [];
