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

  uploadPhoto: async (generatedRidesId, file, caption = '') => {
    const form = new FormData();
    form.append('file', {
      uri: file.uri,
      name: file.fileName ?? 'photo.jpg',
      type: file.type ?? 'image/jpeg',
    });
    if (caption) form.append('caption', caption);

    const response = await api.get(`/view/${generatedRidesId}/photo`, form);
    if (!response.ok) throw new Error('Failed to upload photo');
    return response.json(); // returns PhotoDTO
  },

  uploadVideo: async (generatedRidesId, file) => {
    const form = new FormData();
    form.append('file', {
      uri: file.uri,
      name: file.fileName ?? 'video.mp4',
      type: file.type ?? 'video/mp4',
    });

    const response = await api.postForm(
      `/view/${generatedRidesId}/video`,
      form,
    );
    if (!response.ok) throw new Error('Failed to upload video');
    return response.json();
  },

  deletePhoto: async (generatedRidesId, photoId) => {
    const response = await api.delete(
      `/view/${generatedRidesId}/photo/${photoId}`,
    );
    if (!response.ok) throw new Error('Failed to delete photo');
  },

    uploadSnapshot: async (generatedRidesId, file) => {
      const fileName = file.fileName ?? 'snapshot.png';
      const fileUri = await dataUriToFile(file.uri, fileName);

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
    const response = await api.get(`/view/${generatedRidesId}/request`);
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
