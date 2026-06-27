import { api } from './Apiclient';
import { dataUriToFile } from '../utilities/dataUriToFile';

export const finishedRideService = {
  // ── Existing ─────────────────────────────────────────────────────────────

  getSnapshot: async generatedRidesId => {
    const response = await api.get(`/view/${generatedRidesId}/snapshot`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('SNAPSHOT_NOT_AVAILABLE');
      }
      throw new Error('Failed to load snapshot');
    }
    const data = await response.json();
    return data.snapshotUrl;
  },


  uploadPersonalSnapshot: async (generatedRidesId, file) => {
    const fileName = file.fileName ?? 'personal-snapshot.png';

    const form = new FormData();
    form.append('file', {
      uri: file.uri,        // ← use directly, no conversion needed
      name: fileName,
      type: file.type ?? 'image/png',
    });

    const response = await api.postForm(
      `/view/${generatedRidesId}/personal-snapshot`,
      form,
    );
    if (!response.ok) throw new Error('Failed to upload personal snapshot');
    const data = await response.json();
    return data.snapshotUrl;
  },


  getPersonalSnapshot: async generatedRidesId => {
    const response = await api.get(`/view/${generatedRidesId}/personal-snapshot`);
    if (!response.ok) {
      if (response.status === 404) throw new Error('SNAPSHOT_NOT_AVAILABLE');
      throw new Error('Failed to load personal snapshot');
    }
    const data = await response.json();
    return data.snapshotUrl;
  },

};
