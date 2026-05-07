import {ERROR_MESSAGES} from './errorMessages';

export const isValidCoordinate = coord => {
  const num = typeof coord === 'string' ? parseFloat(coord) : coord;
  return !isNaN(num) && num !== 0 && isFinite(num);
};

export const areCoordinatesValid = (startLat, startLng, endLat, endLng) => {
  return (
    isValidCoordinate(startLat) &&
    isValidCoordinate(startLng) &&
    isValidCoordinate(endLat) &&
    isValidCoordinate(endLng)
  );
};

export const parseCoordinateSafely = value => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0 || !isFinite(num)) {
    return null;
  }
  return num;
};

export const validateLatitude = coord => {
  const num = typeof coord === 'string' ? parseFloat(coord) : coord;
  if (isNaN(num) || !isFinite(num))
    return ERROR_MESSAGES.LOCATION.COORDINATES_INVALID;
  if (num === 0) return ERROR_MESSAGES.RIDE_CREATION.COORDINATES_ZERO;
  if (Math.abs(num) > 90)
    return ERROR_MESSAGES.LOCATION.COORDINATES_OUT_OF_BOUNDS;
  return null;
};

export const validateLongitude = coord => {
  const num = typeof coord === 'string' ? parseFloat(coord) : coord;
  if (isNaN(num) || !isFinite(num))
    return ERROR_MESSAGES.LOCATION.COORDINATES_INVALID;
  if (num === 0) return ERROR_MESSAGES.RIDE_CREATION.COORDINATES_ZERO;
  if (Math.abs(num) > 180)
    return ERROR_MESSAGES.LOCATION.COORDINATES_OUT_OF_BOUNDS;
  return null;
};