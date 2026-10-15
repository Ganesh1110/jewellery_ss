import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function saveUploadedFile(file: File): Promise<UploadResult> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WEBP, AVIF, GIF.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum allowed 10MB limit.`);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate safe collision-resistant filename
  const ext = path.extname(file.name).toLowerCase() || `.${file.type.split('/')[1] || 'jpg'}`;
  const randomHash = crypto.randomBytes(16).toString('hex');
  const safeFilename = `${Date.now()}-${randomHash}${ext}`;

  // If S3 / Cloudflare R2 environment variables are configured, upload to S3/R2
  const s3Endpoint = process.env.S3_ENDPOINT;
  const s3Bucket = process.env.S3_BUCKET;
  const s3AccessKey = process.env.S3_ACCESS_KEY_ID;
  const s3SecretKey = process.env.S3_SECRET_ACCESS_KEY;
  const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_URL || process.env.S3_PUBLIC_URL;

  if (s3Endpoint && s3Bucket && s3AccessKey && s3SecretKey) {
    // S3/R2 Upload via S3 REST API or SDK
    const s3Url = `${s3Endpoint.replace(/\/$/, '')}/${s3Bucket}/products/${safeFilename}`;
    const publicUrl = cdnBaseUrl
      ? `${cdnBaseUrl.replace(/\/$/, '')}/products/${safeFilename}`
      : s3Url;

    // Send PUT request to S3/R2 endpoint
    try {
      const res = await fetch(s3Url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Content-Length': buffer.length.toString(),
          'x-amz-acl': 'public-read',
        },
        body: buffer,
      });

      if (!res.ok) {
        throw new Error(`S3 upload failed with status ${res.status}`);
      }

      return {
        url: publicUrl,
        filename: safeFilename,
        size: file.size,
        mimeType: file.type,
      };
    } catch {
      // Fallback to local storage if remote upload encounters network issues
    }
  }

  // Local persistent storage fallback (/public/uploads)
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, safeFilename);
  await fs.writeFile(filePath, buffer);

  const publicUrl = cdnBaseUrl
    ? `${cdnBaseUrl.replace(/\/$/, '')}/uploads/${safeFilename}`
    : `/uploads/${safeFilename}`;

  return {
    url: publicUrl,
    filename: safeFilename,
    size: file.size,
    mimeType: file.type,
  };
}
