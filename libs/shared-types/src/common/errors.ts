/**
 * Standard error types for the application
 * All errors should extend these base classes
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly i18nKey?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, i18nKey?: string) {
    super(message, 'VALIDATION_ERROR', 400, i18nKey);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, i18nKey?: string) {
    super(message, 'NOT_FOUND', 404, i18nKey);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, i18nKey?: string) {
    super(message, 'UNAUTHORIZED', 401, i18nKey);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, i18nKey?: string) {
    super(message, 'FORBIDDEN', 403, i18nKey);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, i18nKey?: string) {
    super(message, 'CONFLICT', 409, i18nKey);
  }
}

export class InsufficientResourcesError extends AppError {
  constructor(message: string, i18nKey?: string) {
    super(message, 'INSUFFICIENT_RESOURCES', 507, i18nKey);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, i18nKey?: string) {
    super(message, 'CONFIGURATION_ERROR', 500, i18nKey);
  }
}


