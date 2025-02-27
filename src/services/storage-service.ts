import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Express } from 'express';

export class StorageService {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    // Initialize S3 client with DO Spaces configuration
    this.s3Client = new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT,
      region: 'us-east-1', // DO Spaces uses this region
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY || '',
        secretAccessKey: process.env.DO_SPACES_SECRET || ''
      }
    });

    this.bucket = process.env.DO_SPACES_BUCKET || '';
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const key = `${folder}/${Date.now()}-${file.originalname}`;

    try {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private' // Ensures the file is private
      }));

      // Return the file URL (but don't expose it publicly)
      return key;
    } catch (error) {
      console.error('Error uploading file to DO Spaces:', error);
      throw new Error('Failed to upload file');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      }));
    } catch (error) {
      console.error('Error deleting file from DO Spaces:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Get signed URL for temporary file access
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // Implementation will be added when needed
    throw new Error('Not implemented');
  }
}
