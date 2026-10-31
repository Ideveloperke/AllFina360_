import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { ENV, type Env } from '../config/env';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(@Inject(ENV) env: Env) {
    this.bucket = env.S3_BUCKET;
    this.s3 = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      // Otherwise the SDK signs a CRC32 of the (empty) body into presigned PUT URLs, and the
      // browser's real upload is rejected with BadDigest.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }

  /**
   * Short-lived URL the browser uses to upload a file directly to storage.
   * Encryption at rest is enforced with the bucket's default encryption policy in production.
   */
  createUploadUrl(key: string, contentType: string): Promise<string> {
    return getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: 15 * 60 },
    );
  }

  /** Short-lived URL internal services use to read a file. */
  createDownloadUrl(key: string): Promise<string> {
    return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: 60 * 60,
    });
  }
}
