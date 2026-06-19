/**
 * Converts a data URI to a object FormData can stream in React Native / Hermes.
 * React Native's FormData already handles both file:// URIs and data: URIs
 * natively — no RNFS or temp-file write needed.
 *
 * If the URI is already a file:// or content:// path, it is returned as-is.
 * If it is a data: URI, it is returned as-is too — RN's native layer handles it.
 */
export function dataUriToFile(dataUri, fileName) {
  // Nothing to transform — RN FormData handles both data: and file:// URIs.
  return dataUri;
}
