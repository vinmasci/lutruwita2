import { Response } from 'express';
import { ErrorResponse, SafeError, isErrorWithMessage } from '../types/server';

export function handleError(error: SafeError, res: Response<ErrorResponse>) {
  console.error('Error:', error);
  
  let errorMessage: string;
  
  if (isErrorWithMessage(error)) {
    errorMessage = error.message;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    errorMessage = 'An unknown error occurred';
  }
  
  return res.status(500).json({ error: errorMessage });
}

export function handleBadRequest(message: string, res: Response<ErrorResponse>) {
  return res.status(400).json({ error: message });
}

export function handleUnauthorized(message: string, res: Response<ErrorResponse>) {
  return res.status(401).json({ error: message });
}

export function handleNotFound(message: string, res: Response<ErrorResponse>) {
  return res.status(404).json({ error: message });
}
