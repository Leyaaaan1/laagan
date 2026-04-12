/**
 * Centralized error message definitions
 * Single source of truth for all user-facing error messages
 */

export const ERROR_MESSAGES = {
  // ─── AUTHENTICATION ERRORS ─────────────────────────────────────────────
  AUTH: {
    MISSING_TOKEN: 'Authentication token not found. Please log in again.',
    INVALID_TOKEN: 'Invalid authentication token. Please log in again.',
    TOKEN_EXPIRED: 'Session expired. Please log in again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    LOGIN_FAILED: 'Login failed. Please check your credentials.',
    REGISTER_FAILED: 'Registration failed. Please try again.',
    ALREADY_LOGGED_IN: 'You are already logged in.',
  },

  // ─── RIDE CREATION ERRORS ──────────────────────────────────────────────
  RIDE_CREATION: {
    RIDE_NAME_REQUIRED: 'Please enter a ride name.',
    RIDE_NAME_TOO_SHORT: 'Ride name must be at least 3 characters.',
    RIDE_DATE_REQUIRED: 'Please select a ride date.',
    RIDE_DATE_PAST: 'Ride date must be in the future.',
    RIDE_DATE_TOO_FAR: 'Ride cannot be more than 6 months in the future.',
    STARTING_POINT_REQUIRED: 'Starting point is required.',
    STARTING_POINT_COORDINATES_INVALID:
      'Starting point coordinates are invalid. Please set starting location on the map.',
    ENDING_POINT_REQUIRED: 'Ending point is required.',
    ENDING_POINT_COORDINATES_INVALID:
      'Ending point coordinates are invalid. Please set ending location on the map.',
    DESTINATION_REQUIRED: 'Please select a destination location.',
    DESTINATION_COORDINATES_INVALID:
      'Destination coordinates are missing. Tap on the map to set location.',
    COORDINATES_ZERO:
      'Coordinates cannot be (0,0). Please select a valid location.',
    COORDINATES_MISSING: 'Coordinates missing. Please set location on the map.',
    RIDE_CREATION_FAILED: 'Failed to create ride. Please try again.',
    RIDE_CREATION_NO_ID: 'Ride was created but no ID was returned from server.',
    PARTICIPANTS_INVALID: 'Invalid participant format.',
    DESCRIPTION_TOO_LONG: 'Description must be less than 500 characters.',
  },

  // ─── LOCATION ERRORS ───────────────────────────────────────────────────
  LOCATION: {
    SEARCH_FAILED: 'Failed to search locations. Please try again.',
    LOCATION_NOT_FOUND: 'Location not found. Please try another search.',
    REVERSE_GEOCODE_FAILED: 'Failed to get location name. Please try again.',
    COORDINATES_REQUIRED: 'Location coordinates are required.',
    COORDINATES_INVALID: 'Invalid coordinates.',
    COORDINATES_OUT_OF_BOUNDS:
      'Coordinates are out of valid geographic bounds.',
    PERMISSION_DENIED:
      'Location permission denied. Please enable it in settings.',
    PERMISSION_NOT_GRANTED: 'Location permission not granted.',
  },

  // ─── NETWORK ERRORS ────────────────────────────────────────────────────
  NETWORK: {
    CONNECTION_FAILED:
      'Network connection failed. Please check your internet connection.',
    REQUEST_TIMEOUT: 'Request timed out. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    BAD_REQUEST: 'Invalid request. Please check your input.',
    NOT_FOUND: 'Resource not found.',
    CONFLICT: 'This action conflicts with existing data.',
    RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
    SERVICE_UNAVAILABLE:
      'Service temporarily unavailable. Please try again later.',
  },

  // ─── RIDE OPERATIONS ───────────────────────────────────────────────────
  RIDE_OPERATIONS: {
    RIDE_NOT_FOUND: 'Ride not found.',
    RIDE_NOT_ACTIVE: 'This ride is not active.',
    RIDE_ALREADY_STARTED: 'This ride has already been started.',
    RIDE_ALREADY_ENDED: 'This ride has already ended.',
    NOT_RIDE_OWNER: 'You are not the owner of this ride.',
    NOT_PARTICIPANT: 'You are not a participant in this ride.',
    ALREADY_JOINED: 'You have already joined this ride.',
    ALREADY_REQUESTED: 'You have already sent a request to join this ride.',
    CANNOT_JOIN_OWN_RIDE: 'You cannot join your own ride.',
    START_RIDE_FAILED: 'Failed to start the ride. Please try again.',
    STOP_RIDE_FAILED: 'Failed to stop the ride. Please try again.',
    CANNOT_START_MULTIPLE: 'You have currently ongoing rides.',
    FETCH_DETAILS_FAILED: 'Failed to load ride details. Please try again.',
  },

  // ─── PARTICIPANT/JOIN ERRORS ───────────────────────────────────────────
  PARTICIPANTS: {
    JOIN_FAILED: 'Failed to join the ride. Please try again.',
    JOIN_REQUEST_FAILED: 'Failed to send join request. Please try again.',
    APPROVE_REQUEST_FAILED: 'Failed to approve request. Please try again.',
    REJECT_REQUEST_FAILED: 'Failed to reject request. Please try again.',
    FETCH_PARTICIPANTS_FAILED: 'Failed to load participants. Please try again.',
    FETCH_REQUESTS_FAILED: 'Failed to load join requests. Please try again.',
    INVITE_EXPIRED: 'This invite link has expired.',
    INVITE_INVALID: 'Invalid invite link.',
    QR_CODE_INVALID: 'This QR code does not contain a valid invite link.',
  },

  // ─── PROFILE ERRORS ────────────────────────────────────────────────────
  PROFILE: {
    FETCH_PROFILE_FAILED: 'Failed to load profile. Please try again.',
    UPDATE_PROFILE_FAILED: 'Failed to update profile. Please try again.',
    PROFILE_NOT_FOUND: 'Profile not found.',
    INVALID_PROFILE_DATA: 'Invalid profile data.',
    DISPLAY_NAME_REQUIRED: 'Display name is required.',
    DISPLAY_NAME_TOO_LONG: 'Display name must be less than 50 characters.',
    PHONE_INVALID: 'Invalid phone number format.',
    BIO_TOO_LONG: 'Bio must be less than 200 characters.',
    PROFILE_PICTURE_INVALID: 'Invalid profile picture URL.',
  },

  // ─── IMAGE/MEDIA ERRORS ────────────────────────────────────────────────
  MEDIA: {
    IMAGE_FETCH_FAILED: 'Failed to load images. Please try again.',
    IMAGES_UNAVAILABLE: 'No images available.',
    IMAGE_LOAD_TIMEOUT: 'Image loading timed out.',
    INVALID_IMAGE_URL: 'Invalid image URL.',
  },

  // ─── MAP/ROUTE ERRORS ──────────────────────────────────────────────────
  MAP: {
    MAP_INITIALIZATION_FAILED:
      'Failed to initialize map. Please refresh the screen.',
    MAP_CONNECTION_LOST: 'Map connection lost. Please refresh the screen.',
    ROUTE_DRAW_FAILED: 'Failed to draw route. Please try again.',
    ROUTE_COORDINATES_UNAVAILABLE: 'Route coordinates unavailable.',
    ROUTE_NOT_FOUND: 'Route information not found.',
    INVALID_ROUTE_DATA: 'Invalid route data received from server.',
  },

  // ─── LOCATION POLLING ERRORS ───────────────────────────────────────────
  LOCATION_POLLING: {
    POLLING_FAILED: 'Location polling failed.',
    GPS_ERROR:
      'Failed to get GPS location. Please check your location settings.',
    GPS_TIMEOUT: 'GPS acquisition timed out. Using network location.',
    PERMISSION_REQUIRED: 'Location permission required to share your location.',
  },

  // ─── QR CODE/SCANNER ERRORS ────────────────────────────────────────────
  SCANNER: {
    QR_CODE_INVALID: 'Invalid QR code.',
    RIDE_ID_INVALID: 'This QR code does not contain a valid ride ID.',
    CAMERA_PERMISSION_REQUIRED: 'Camera permission required to scan QR codes.',
    CAMERA_PERMISSION_DENIED:
      'Camera permission denied. Please enable it in settings.',
    SCAN_FAILED: 'Failed to scan QR code. Please try again.',
  },

  // ─── GENERIC/FALLBACK ERRORS ───────────────────────────────────────────
  GENERIC: {
    UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
    INVALID_INPUT: 'Invalid input. Please check your data.',
    MISSING_DATA: 'Required data is missing.',
    OPERATION_FAILED: 'Operation failed. Please try again.',
    UNKNOWN_ERROR: 'An unknown error occurred.',
  },
};

/**
 * Get error message by category and key
 * @param {string} category - Error category (AUTH, RIDE_CREATION, etc.)
 * @param {string} key - Error key (MISSING_TOKEN, RIDE_NAME_REQUIRED, etc.)
 * @param {string} fallback - Fallback message if key not found
 * @returns {string} Error message
 */
export const getErrorMessage = (
  category,
  key,
  fallback = ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
) => {
  return ERROR_MESSAGES[category]?.[key] ?? fallback;
};

/**
 * Map HTTP status codes to error messages
 */
export const getErrorByHttpStatus = status => {
  switch (status) {
    case 400:
      return ERROR_MESSAGES.NETWORK.BAD_REQUEST;
    case 401:
      return ERROR_MESSAGES.AUTH.TOKEN_EXPIRED;
    case 403:
      return ERROR_MESSAGES.AUTH.UNAUTHORIZED;
    case 404:
      return ERROR_MESSAGES.NETWORK.NOT_FOUND;
    case 409:
      return ERROR_MESSAGES.NETWORK.CONFLICT;
    case 429:
      return ERROR_MESSAGES.NETWORK.RATE_LIMITED;
    case 500:
    case 502:
    case 503:
      return ERROR_MESSAGES.NETWORK.SERVER_ERROR;
    case 504:
      return ERROR_MESSAGES.NETWORK.REQUEST_TIMEOUT;
    default:
      return ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR;
  }
};

/**
 * Extract user-friendly error message from various error objects
 */
export const resolveErrorMessage = (
  error,
  defaultMessage = ERROR_MESSAGES.GENERIC.OPERATION_FAILED,
) => {
  // HTTP error with status
  if (error?.response?.status) {
    return getErrorByHttpStatus(error.response.status);
  }

  // Axios/Fetch error response data
  if (error?.response?.data) {
    if (typeof error.response.data === 'string') {
      return error.response.data;
    }
    if (error.response.data.message) {
      return error.response.data.message;
    }
  }

  // Network error patterns
  if (error?.message?.includes('Failed to fetch')) {
    return ERROR_MESSAGES.NETWORK.CONNECTION_FAILED;
  }
  if (error?.message?.includes('timeout')) {
    return ERROR_MESSAGES.NETWORK.REQUEST_TIMEOUT;
  }
  if (error?.message?.includes('Network')) {
    return ERROR_MESSAGES.NETWORK.CONNECTION_FAILED;
  }

  // Direct error message
  if (error?.message && typeof error.message === 'string') {
    return error.message;
  }

  // Fallback
  return defaultMessage;
};

export default ERROR_MESSAGES;
