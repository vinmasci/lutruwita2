import { ErrorResponse, ErrorHandler } from '../../types/express.types';

interface AppError extends Error {
  status?: number;
  expose?: boolean;
}

export const errorHandler: ErrorHandler = (err: unknown, req, res, next) => {
  // Handle different error types
  const error: AppError = (err instanceof Error) ? err : new Error('Unknown error occurred');
  const status = (err as AppError).status || 500;
  const message = error.expose ? error.message : 'An error occurred';

  const response: ErrorResponse = {
    error: message
  };
  
  res.status(status).json(response);
};
