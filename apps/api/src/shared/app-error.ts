export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }

  static notFound(resource: string) {
    return new AppError(`${resource} غير موجود`, 404, 'NOT_FOUND');
  }

  static forbidden(action: string) {
    return new AppError(`ليس لديك صلاحية: ${action}`, 403, 'FORBIDDEN');
  }

  static conflict(message: string) {
    return new AppError(message, 409, 'CONFLICT');
  }
}
