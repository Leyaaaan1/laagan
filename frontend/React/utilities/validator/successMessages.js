/**
 * Centralized success message definitions
 */

export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Login successful!',
    REGISTER_SUCCESS: 'Registration successful!',
    LOGOUT_SUCCESS: 'Logged out successfully.',
  },

  RIDE_OPERATIONS: {
    RIDE_CREATED: 'Ride created successfully!',
    RIDE_STARTED: 'Ride started successfully!',
    RIDE_STOPPED: 'Ride stopped successfully!',
    RIDE_UPDATED: 'Ride updated successfully!',
  },

  PARTICIPANTS: {
    JOIN_REQUEST_SENT:
      'Your join request has been submitted. Waiting for approval.',
    JOIN_REQUEST_APPROVED: 'Join request approved!',
    JOIN_REQUEST_REJECTED: 'Join request rejected.',
    JOINED_RIDE: 'You have joined the ride!',
    ALL_REQUESTS_APPROVED: 'All requests have been approved.',
  },

  PROFILE: {
    PROFILE_UPDATED: 'Profile updated successfully!',
    PROFILE_LOADED: 'Profile loaded successfully.',
  },

  GENERAL: {
    OPERATION_SUCCESS: 'Operation completed successfully!',
    SAVED: 'Saved successfully!',
    DELETED: 'Deleted successfully!',
    CHANGES_SAVED: 'Changes saved successfully!',
  },
};

/**
 * Get success message by category and key
 */
export const getSuccessMessage = (category, key, fallback = 'Success!') => {
  return SUCCESS_MESSAGES[category]?.[key] ?? fallback;
};

export default SUCCESS_MESSAGES;
