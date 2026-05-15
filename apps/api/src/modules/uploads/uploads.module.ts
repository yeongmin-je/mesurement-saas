import { Module } from '@nestjs/common';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { S3Service } from './s3.service';

@Module({
  controllers: [PhotosController],
  providers: [PhotosService, S3Service],
  exports: [PhotosService, S3Service],
})
export class UploadsModule {}
