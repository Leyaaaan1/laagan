import RNFS from 'react-native-fs';

/**
 * React Native's multipart FormData uploader can't read "data:" URIs —
 * it needs a file/content URI it can stream from the native layer.
 * This writes the base64 payload to a temp file and returns its file:// path.
 */
export async function dataUriToFile(dataUri, fileName) {
  const match = dataUri.match(/^data:(.+);base64,(.*)$/);
  if (!match) {
    // Not a data URI (already a real path) — nothing to do.
    return dataUri;
  }

  const base64Data = match[2];
  const path = `${RNFS.CachesDirectoryPath}/${fileName}`;
  await RNFS.writeFile(path, base64Data, 'base64');
  return `file://${path}`;
}
