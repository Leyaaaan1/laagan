import {api} from './Apiclient';
import {dataUriToFile} from '../utilities/dataUriToFile';

export const finishedRideService = {
  // ── Existing ─────────────────────────────────────────────────────────────

  getRideDetail: async generatedRidesId => {
    const response = await api.get(`/view/${generatedRidesId}/detail`);
    if (!response.ok) {
      // Backend throws when neither a personal nor a group finish record
      // exists yet — that's an expected "nothing to show yet" state, not
      // a real failure, so it gets its own sentinel.
      if (response.status === 404) {
        throw new Error('NOT_YET_AVAILABLE');
      }
      throw new Error('Failed to load ride detail');
    }
    return response.json();
  },
  uploadSnapshot: async (generatedRidesId, file) => {
    const fileName = file.fileName ?? 'snapshot.png';
    const fileUri = dataUriToFile(file.uri, fileName); // sync — no await needed

    const form = new FormData();
    form.append('file', {
      uri: fileUri,
      name: fileName,
      type: file.type ?? 'image/png',
    });

    const response = await api.postForm(
      `/view/${generatedRidesId}/snapshot`,
      form,
    );
    if (!response.ok) throw new Error('Failed to upload snapshot');
    const data = await response.json();
    return data.snapshotUrl;
  },

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
};
