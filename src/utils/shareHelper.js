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

// Universal UTF-8 safe base64 encoding for full catalog
export function encodeCatalogToShareString(tests) {
  try {
    const json = JSON.stringify(tests);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return b64;
  } catch (err) {
    console.error("Error encoding catalog:", err);
    return null;
  }
}

// Decode catalog of tests from shareable string
export function decodeCatalogFromShareString(b64) {
  try {
    const json = decodeURIComponent(escape(atob(b64)));
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.filter((t) => t && t.title && Array.isArray(t.questions));
    }
  } catch (err) {
    console.error("Error decoding catalog:", err);
  }
  return null;
}

// Generate full shareable URL for entire test series catalog
export function generateCatalogShareUrl(tests) {
  const code = encodeCatalogToShareString(tests);
  if (!code) return window.location.href;
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("catalog", code);
  return url.toString();
}

// Check URL params on app load for shared catalog
export function getSharedCatalogFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const catalogParam = params.get("catalog") || params.get("allTests");
    if (catalogParam) {
      return decodeCatalogFromShareString(catalogParam);
    }
  } catch (err) {
    console.error("Error reading shared catalog from URL:", err);
  }
  return null;
}

// Clean URL search param without reloading page
export function cleanShareUrl() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("shareTest");
    url.searchParams.delete("testData");
    url.searchParams.delete("catalog");
    url.searchParams.delete("allTests");
    window.history.replaceState({}, document.title, url.toString());
  } catch (err) {
    console.error("Error cleaning URL:", err);
  }
}

