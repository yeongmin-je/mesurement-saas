import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from './s3.service';

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async issueUploadUrl(
    tenantId: string,
    userId: string,
    fileName: string,
    contentType: string,
    instrumentId?: string,
  ): Promise<{ uploadUrl: string; s3Key: string; photoId: string; expiresIn: number }> {
    const s3Key = this.s3.buildKey(tenantId, fileName);

    // Pre-create the photo row so the recognition flow can reference it before upload completes.
    // instrumentId is nullable — set later when the user confirms registration.
    const photo = await this.prisma.instrumentPhoto.create({
      data: {
        tenantId,
        instrumentId: instrumentId ?? null,
        s3Key,
        uploadedById: userId,
      },
    });

    const uploadUrl = await this.s3.getPresignedUploadUrl(s3Key, contentType, 600);
    return { uploadUrl, s3Key, photoId: photo.id, expiresIn: 600 };
  }

  async getDownloadUrl(tenantId: string, photoId: string): Promise<string> {
    const photo = await this.prisma.instrumentPhoto.findFirst({
      where: { id: photoId, instrument: { tenantId } },
    });
    if (!photo) throw new NotFoundException('사진을 찾을 수 없습니다');
    return this.s3.getPresignedDownloadUrl(photo.s3Key);
  }
}
