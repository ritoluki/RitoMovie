class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  email?: string;

  constructor(statusCode: number, message: string, code?: string, email?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.email = email;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;

