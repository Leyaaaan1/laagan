import {ERROR_MESSAGES} from './errorMessages';

/**
 * Validation error utilities
 */

export const validateRideName = rideName => {
  if (!rideName?.trim()) {
    return ERROR_MESSAGES.RIDE_CREATION.RIDE_NAME_REQUIRED;
  }
  if (rideName.trim().length < 3) {
    return ERROR_MESSAGES.RIDE_CREATION.RIDE_NAME_TOO_SHORT;
  }
  return null;
};

export const validateRideDate = date => {
  if (!date) {
    return ERROR_MESSAGES.RIDE_CREATION.RIDE_DATE_REQUIRED;
  }
  const now = new Date();
  if (date <= now) {
    return ERROR_MESSAGES.RIDE_CREATION.RIDE_DATE_PAST;
  }
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  if (date > sixMonthsFromNow) {
    return ERROR_MESSAGES.RIDE_CREATION.RIDE_DATE_TOO_FAR;
  }
  return null;
};

export const validateCoordinate = coord => {
  const num = typeof coord === 'string' ? parseFloat(coord) : coord;
  if (isNaN(num)) {
    return ERROR_MESSAGES.LOCATION.COORDINATES_INVALID;
  }
  if (num === 0) {
    return ERROR_MESSAGES.RIDE_CREATION.COORDINATES_ZERO;
  }
  if (!isFinite(num)) {
    return ERROR_MESSAGES.LOCATION.COORDINATES_INVALID;
  }
  if (Math.abs(num) > 180) {
    return ERROR_MESSAGES.LOCATION.COORDINATES_OUT_OF_BOUNDS;
  }
  return null;
};

export const validateCoordinates = (startLat, startLng, endLat, endLng) => {
  const errors = [];

  if (validateCoordinate(startLat)) {
    errors.push({
      field: 'startLat',
      message: ERROR_MESSAGES.RIDE_CREATION.STARTING_POINT_COORDINATES_INVALID,
    });
  }
  if (validateCoordinate(startLng)) {
    errors.push({
      field: 'startLng',
      message: ERROR_MESSAGES.RIDE_CREATION.STARTING_POINT_COORDINATES_INVALID,
    });
  }
  if (validateCoordinate(endLat)) {
    errors.push({
      field: 'endLat',
      message: ERROR_MESSAGES.RIDE_CREATION.ENDING_POINT_COORDINATES_INVALID,
    });
  }
  if (validateCoordinate(endLng)) {
    errors.push({
      field: 'endLng',
      message: ERROR_MESSAGES.RIDE_CREATION.ENDING_POINT_COORDINATES_INVALID,
    });
  }

  return errors.length > 0 ? errors : null;
};

export const validateDisplayName = displayName => {
  if (!displayName?.trim()) {
    return ERROR_MESSAGES.PROFILE.DISPLAY_NAME_REQUIRED;
  }
  if (displayName.length > 50) {
    return ERROR_MESSAGES.PROFILE.DISPLAY_NAME_TOO_LONG;
  }
  return null;
};

export const validatePhone = phone => {
  if (
    phone &&
    !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(
      phone,
    )
  ) {
    return ERROR_MESSAGES.PROFILE.PHONE_INVALID;
  }
  return null;
};

export const validateBio = bio => {
  if (bio && bio.length > 200) {
    return ERROR_MESSAGES.PROFILE.BIO_TOO_LONG;
  }
  return null;
};

export const validateDescription = description => {
  if (description && description.length > 500) {
    return ERROR_MESSAGES.RIDE_CREATION.DESCRIPTION_TOO_LONG;
  }
  return null;
};
