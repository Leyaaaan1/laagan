import {api} from './Apiclient';

export const joinService = {
  joinRideById: async (generatedRidesId, token = null) => {
    const inviteResponse = await api.get(
      `/invite-request/${generatedRidesId}/invites`,
      token,
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
      token,
    );
    if (!joinResponse.ok) {
      const err = await joinResponse
        .text()
        .catch(() => `Error: ${joinResponse.status}`);
      throw new Error(err);
    }
    return joinResponse.json();
  },

  joinRideByToken: async (inviteToken, token = null) => {
    const response = await api.post(`/join-request/${inviteToken}`, {}, token);
    if (!response.ok) {
      const err = await response
        .text()
        .catch(() => `Error: ${response.status}`);
      throw new Error(err);
    }
    return response.json();
  },

  joinViaQrCode: async (scannedValue, token = null) => {
    const inviteToken = scannedValue.includes('/invite/link/')
      ? scannedValue.split('/invite/link/').pop()
      : scannedValue;
    const response = await api.post(
      `/join-request/qr/${inviteToken}`,
      {},
      token,
    );
    if (!response.ok) {
      const err = await response
        .text()
        .catch(() => `Failed to join ride: ${response.status}`);
      throw new Error(err);
    }
    return response.json();
  },

  getJoinersByRide: async (generatedRidesId, status = null, token = null) => {
    const query = status ? `?status=${status}` : '';
    const response = await api.get(
      `/join-request/${generatedRidesId}/joiners${query}`,
      token,
    );
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
  },

  approveJoinRequest: async (joinId, token = null) => {
    const response = await api.put(
      `/join-request/approve/${joinId}`,
      {},
      token,
    );
    if (!response.ok) {
      const err = await response
        .text()
        .catch(() => `Error: ${response.status}`);
      throw new Error(err);
    }
    return response.json();
  },

  rejectJoinRequest: async (joinId, token = null) => {
    const response = await api.put(`/join-request/reject/${joinId}`, {}, token);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
  },
};
