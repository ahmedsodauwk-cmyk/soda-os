export type DomainActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export function actionError(message: string): { ok: false; error: string } {
  return { ok: false, error: message };
}

export function sanitizeActionError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return "Operation failed.";
}
