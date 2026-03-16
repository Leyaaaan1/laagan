import { BASE_URL } from '@env';

// Use API_BASE_URL instead of hardcoded value
const API_BASE_URL = BASE_URL || 'http://localhost:8080';

/**
 * Invite Service
 * Handles all invite-related API calls for ride invitations
 */
export const inviteService = {

    getQrCodeUrl: async (generatedRidesId, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/invite/${generatedRidesId}/qr-url`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error: ${response.status}`);
            }

            return await response.text(); // Returns URL string
        } catch (error) {
            console.error('Error fetching QR code URL:', error);
            throw error;
        }
    },


    getQrCodeBase64: async (generatedRidesId, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/invite/${generatedRidesId}/qr-base64`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error: ${response.status}`);
            }

            return await response.text(); // Returns Base64 string
        } catch (error) {
            console.error('Error fetching QR code Base64:', error);
            throw error;
        }
    },


    getInviteDetails: async (generatedRidesId, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/invite/${generatedRidesId}/invites`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error: ${response.status}`);
            }

            return await response.text(); // Returns invite link string
        } catch (error) {
            console.error('Error fetching invite details:', error);
            throw error;
        }
    },


    getAllInviteData: async (generatedRidesId, token) => {
        try {
            const [qrUrl, qrBase64, inviteLink] = await Promise.all([
                inviteService.getQrCodeUrl(generatedRidesId, token).catch(() => null),
                inviteService.getQrCodeBase64(generatedRidesId, token).catch(() => null),
                inviteService.getInviteDetails(generatedRidesId, token).catch(() => null)
            ]);

            return {
                qrUrl,
                qrBase64,
                inviteLink
            };
        } catch (error) {
            console.error('Error fetching all invite data:', error);
            throw error;
        }
    },




};