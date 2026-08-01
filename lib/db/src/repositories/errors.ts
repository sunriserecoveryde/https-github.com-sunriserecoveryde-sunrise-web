/**
 * Typed application errors for the Sunrise OS repository layer.
 * Raw database errors must never surface directly to API consumers.
 */

export class DatabaseError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "DatabaseError";
    this.cause = cause;
  }
}

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "NotFoundError";
  }
}

export class AccessDeniedError extends Error {
  constructor(entity: string, id: string) {
    // Deliberately vague — do not reveal whether the record exists in another org.
    super(`${entity} not found: ${id}`);
    this.name = "AccessDeniedError";
  }
}
