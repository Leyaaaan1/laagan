import {api} from './Apiclient';

export const inviteService = {
  getQrCodeUrl: async (generatedRidesId) => {
    const response = await api.get(
      `/invite-request/${generatedRidesId}/qr-url`,
    );
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.text();
  },

  getQrCodeBase64: async (generatedRidesId) => {
    const response = await api.get(
      `/invite-request/${generatedRidesId}/qr-base64`,
    );
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.text();
  },

  getInviteDetails: async (generatedRidesId) => {
    const response = await api.get(
      `/invite-request/${generatedRidesId}/invites`,
    );
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.text();
  },

  getInviteDetailsByToken: async (inviteToken) => {
    const response = await api.get(
      `/invite-request/token/${inviteToken}`,
    );
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
  },

  getAllInviteData: async (generatedRidesId) => {
    const [qrUrl, qrBase64, inviteLink] = await Promise.all([
      inviteService.getQrCodeUrl(generatedRidesId).catch(() => null),
      inviteService.getQrCodeBase64(generatedRidesId).catch(() => null),
      inviteService.getInviteDetails(generatedRidesId).catch(() => null),
    ]);
    return {qrUrl, qrBase64, inviteLink};
  },
};
