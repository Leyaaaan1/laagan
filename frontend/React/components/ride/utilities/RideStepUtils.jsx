
export const formatDate = (dateValue) => {
  if (!dateValue) { return 'Not specified'; }
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(d.getTime())) { return String(dateValue); }

  const datePart = d.toLocaleDateString('en-US', {
    month: 'long', day: '2-digit', year: 'numeric',
  });
  const hours   = d.getHours() % 12 || 12;
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm    = d.getHours() >= 12 ? 'PM' : 'AM';
  return `${datePart} ${hours}:${minutes}${ampm}`;
};


export const splitDateTime = (date) => ({
  dateStr: date.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }),
  timeStr: date.toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit', hour12: true,
  }),
});


export const getLocationDisplayName = (location) => {
  if (typeof location === 'string') { return location; }
  if (location && typeof location === 'object') {
    return location.name || location.address || 'Location';
  }
  return 'Not specified';
};


export const shortLocationName = (displayName, lat, lng) => {
  if (displayName) { return displayName.split(',')[0].trim(); }
  if (lat != null && lng != null) { return `${lat}, ${lng}`; }
  return 'Unknown location';
};


export const getRideTypeIcon = (type) => {
  const icons = {
    car:          'car',
    motor:        'motorcycle',
    bike:         'bicycle',
    run:          'shoe-prints',
    'cafe Racers':'rocket',
  };
  return icons[type] || 'circle';
};


export const RIDE_TYPE_OPTIONS = [
  { type: 'car',         icon: 'car',        label: 'Car'         },
  { type: 'motor',       icon: 'motorcycle', label: 'Motorcycle'  },
  { type: 'run',         icon: 'user',       label: 'Run'         },
  { type: 'bike',        icon: 'bicycle',    label: 'Bike'        },
  { type: 'cafe Racers', icon: 'rocket',     label: 'Cafe Racers' },
];


export const buildSearchHandlers = ({
                                      debounceRef,
                                      setLocalQuery,
                                      handleSearchInputChange,
                                      setSearchQuery,
                                      delay = 400,
                                    }) => ({
  handleLocalChange: (value) => {
    setLocalQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearchInputChange(value), delay);
  },
  handleClearSearch: () => {
    setLocalQuery('');
    clearTimeout(debounceRef.current);
    if (setSearchQuery)          { setSearchQuery(''); }
    handleSearchInputChange('');
  },
});


export const buildCenterMapScript = (lat, lng, zoom = 15) =>
  `if(window.centerMap&&window.updateMarker){window.centerMap(${lat},${lng},${zoom});window.updateMarker(${lat},${lng});}true;`;


export const buildDrawRouteScript = ({
                                       routeGeoJSON,
                                       startLat, startLng,
                                       endLat, endLng,
                                       stopPoints = [],
                                     }) => `
  (function(){
    try {
      const g = ${JSON.stringify(routeGeoJSON)};
      if (window.clearRoute)           { window.clearRoute(); }
      if (window.drawGeoJsonRoute)     { window.drawGeoJsonRoute(g, {color:'#1e40af',weight:4,opacity:0.8}); }
      if (window.addRouteMarkers)      { window.addRouteMarkers(
        [${startLat},${startLng}],
        [${endLat},${endLng}],
        ${JSON.stringify(stopPoints.map(s => [s.lat, s.lng]))}
      ); }
      if (window.fitGeoJsonRouteToMap) { window.fitGeoJsonRouteToMap(g); }
    } catch(e){ console.error(e); }
  })(); true;
`;