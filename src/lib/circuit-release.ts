// The single declared release pin for the site. Every other copy of the
// tag (homepage install command, docs install snippet) must string-equal
// this constant — scripts/check-content.mjs enforces it in CI. Release
// flow: bump this constant; CI lists every copy that disagrees.
export const CIRCUIT_RELEASE_TAG = "circuit--v0.1.0-alpha.9";
