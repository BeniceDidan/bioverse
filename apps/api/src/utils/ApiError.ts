export class ApiError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(statusCode: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static badRequest(message: string, errors?: Record<string, string[]>) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Anda harus masuk terlebih dahulu") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Anda tidak memiliki akses") {
    return new ApiError(403, message);
  }

  static notFound(message = "Data tidak ditemukan") {
    return new ApiError(404, message);
  }

  static conflict(message: string) {
    return new ApiError(409, message);
  }
}
