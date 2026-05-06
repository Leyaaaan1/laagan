import {api} from './Apiclient';

export const joinService = {
  joinRideById: async (generatedRidesId) => {
    const inviteResponse = await api.get(
      `/invite-request/${generatedRidesId}/invites`,
    );
    if (!inviteResponse.ok)
      throw new Error(`Failed to get invite: ${inviteResponse.status}`);
    const inviteUrl = await inviteResponse.text();
    const inviteToken = inviteUrl.includes('/invite/link/')
      ? inviteUrl.split('/invite/link/').pop()
      : inviteUrl;
    const joinResponse = await api.post(
      `/join-request/${inviteToken}`,
      {},
    );
    if (!joinResponse.ok) {
      const err = await joinResponse
        .text()
        .catch(() => `Error: ${joinResponse.status}`);
      throw new Error(err);
    }
    return joinResponse.json();
  },

  joinRideByToken: async (inviteToken) => {
    const response = await api.post(`/join-request/${inviteToken}`, {});
    if (!response.ok) {
      const err = await response
        .text()
        .catch(() => `Error: ${response.status}`);
      throw new Error(err);
    }
    return response.json();
  },

  joinViaQrCode: async (scannedValue) => {
    const inviteToken = scannedValue.includes('/invite/link/')
      ? scannedValue.split('/invite/link/').pop()
      : scannedValue;
    const response = await api.post(
      `/join-request/qr/${inviteToken}`,
      {},
    );
    if (!response.ok) {
      const err = await response
        .text()
        .catch(() => `Failed to join ride: ${response.status}`);
      throw new Error(err);
    }
    return response.json();
  },

  getJoinersByRide: async (generatedRidesId, status = null, ) => {
    const query = status ? `?status=${status}` : '';
    const response = await api.get(
      `/join-request/${generatedRidesId}/joiners${query}`,
    );
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
  },

  approveJoinRequest: async (joinId) => {
    const response = await api.put(
      `/join-request/approve/${joinId}`,
      {},
    );
    if (!response.ok) {
      const err = await response
        .text()
        .catch(() => `Error: ${response.status}`);
      throw new Error(err);
    }
    return response.json();
  },

  rejectJoinRequest: async (joinId) => {
    const response = await api.put(`/join-request/reject/${joinId}`, {});
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
  },
};
