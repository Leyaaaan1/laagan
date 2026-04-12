import {api} from './Apiclient';

export const inviteService = {
  getQrCodeUrl: async (generatedRidesId, token = null) => {
    const response = await api.get(
      `/invite-request/${generatedRidesId}/qr-url`,
      token,
    );
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.text();
  },

  getQrCodeBase64: async (generatedRidesId, token = null) => {
    const response = await api.get(
      `/invite-request/${generatedRidesId}/qr-base64`,
      token,
    );
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.text();
  },

  getInviteDetails: async (generatedRidesId, token = null) => {
    const response = await api.get(
      `/invite-request/${generatedRidesId}/invites`,
      token,
    );
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.text();
  },

  getAllInviteData: async (generatedRidesId, token = null) => {
    const [qrUrl, qrBase64, inviteLink] = await Promise.all([
      inviteService.getQrCodeUrl(generatedRidesId, token).catch(() => null),
      inviteService.getQrCodeBase64(generatedRidesId, token).catch(() => null),
      inviteService.getInviteDetails(generatedRidesId, token).catch(() => null),
    ]);
    return {qrUrl, qrBase64, inviteLink};
  },
};
