/**
 * Share and Sync helpers for test sharing across devices without server dependencies.
 */

// Encode test object into a URI-safe shareable string
export function encodeTestToShareString(test) {
  try {
    const json = JSON.stringify(test);
    // Universal UTF-8 safe base64
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return b64;
  } catch (err) {
    console.error("Error encoding test:", err);
    return null;
  }
}

// Decode test object from shareable string
export function decodeTestFromShareString(b64) {
  try {
    const json = decodeURIComponent(escape(atob(b64)));
    const parsed = JSON.parse(json);
    if (parsed && parsed.title && Array.isArray(parsed.questions)) {
      return parsed;
    }
  } catch (err) {
    console.error("Error decoding test:", err);
  }
  return null;
}

// Generate full shareable URL
export function generateShareUrl(test) {
  const code = encodeTestToShareString(test);
  if (!code) return window.location.href;
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("shareTest", code);
  return url.toString();
}

// Check URL params on app load for any shared test
export function getSharedTestFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get("shareTest") || params.get("testData");
    if (shareParam) {
      return decodeTestFromShareString(shareParam);
    }
  } catch (err) {
    console.error("Error reading shared test from URL:", err);
  }
  return null;
}

// Clean URL search param without reloading page
export function cleanShareUrl() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("shareTest");
    url.searchParams.delete("testData");
    window.history.replaceState({}, document.title, url.toString());
  } catch (err) {
    console.error("Error cleaning URL:", err);
  }
}
