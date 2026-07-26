/** Fail fast when a server-only module is imported on the client. */
if (typeof window !== "undefined") {
  throw new Error("This module is server-only.");
}
