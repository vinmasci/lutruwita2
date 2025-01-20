import { Express } from 'express';
import { S3Client } from '@aws-sdk/client-s3';

export class StorageService {
  private s3Client: S3Client;
  private bucket: string;

  constructor();
  
  uploadFile(file: Express.Multer.File, folder: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}
