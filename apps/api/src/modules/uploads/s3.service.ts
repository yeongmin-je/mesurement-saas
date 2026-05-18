import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(cfg: ConfigService) {
    this.bucket = cfg.getOrThrow<string>('S3_BUCKET_NAME');
    const endpoint = cfg.get<string>('S3_ENDPOINT');
    this.client = new S3Client({
      region: cfg.get<string>('AWS_REGION', 'ap-northeast-2'),
      endpoint: endpoint || undefined,
      forcePathStyle: !!endpoint, // required for MinIO
      credentials: {
        accessKeyId: cfg.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: cfg.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  buildKey(tenantId: string, fileName: string): string {
    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
    return `${tenantId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
  }

  async getPresignedUploadUrl(
    s3Key: string,
    contentType: string,
    expiresInSeconds = 600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async getPresignedDownloadUrl(s3Key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: s3Key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async fetchObject(s3Key: string): Promise<Buffer> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: s3Key });
    const response = await this.client.send(command);
    const chunks: Buffer[] = [];
    if (!response.Body) throw new Error(`S3 object ${s3Key} has no body`);
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
