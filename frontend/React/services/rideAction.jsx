/**
 * Service for checking ride action status
 * Determines if user can join, has joined, has pending request, or can start the ride
 */
import {api as ApiClient} from './Apiclient';

class RideActionService {
  async getRideActionStatus(generatedRidesId) {
    try {
      const response = await ApiClient.get(
        `/riders/${generatedRidesId}/action-status`,
      );

      // ApiClient returns a raw fetch Response — the body hasn't been parsed yet.
      // response.data is undefined; we need to call .json() to read the body.
      let data;
      if (response?.data !== undefined) {
        // Some ApiClient wrappers (axios-style) auto-parse into .data
        data = response.data;
      } else if (typeof response?.json === 'function') {
        // Raw fetch Response object — parse the body
        data = await response.json();
      } else {
        // Already a plain object
        data = response;
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      return {
        isOwner: data.isOwner ?? false,
        hasJoined: data.hasJoined ?? false,
        hasPendingRequest: data.hasPendingRequest ?? false,
        rideStarted: data.rideStarted ?? false,
        isActive: data.isActive ?? false,
      };
    } catch (error) {
      console.error(
        'Failed to fetch ride action status:',
        error?.message || error,
      );
      return {
        isOwner: false,
        hasJoined: false,
        hasPendingRequest: false,
        rideStarted: false,
        isActive: false,
      };
    }
  }

  hasUserJoined(actionStatus) {
    return actionStatus?.hasJoined ?? false;
  }

  hasPendingRequest(actionStatus) {
    return actionStatus?.hasPendingRequest ?? false;
  }

  isRideStarted(actionStatus) {
    return actionStatus?.rideStarted ?? false;
  }

  isOwner(actionStatus) {
    return actionStatus?.isOwner ?? false;
  }

  getButtonState(actionStatus) {
    if (!actionStatus) return 'can_join';

    if (actionStatus.isOwner) {
      return actionStatus.rideStarted ? 'owner_started' : 'owner_can_start';
    }

    if (actionStatus.hasJoined) return 'joined';
    if (actionStatus.hasPendingRequest) return 'pending';

    return 'can_join';
  }
}

export const rideAction = new RideActionService();
