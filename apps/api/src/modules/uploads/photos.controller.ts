import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { PhotosService } from './photos.service';
import { CreateUploadUrlDto } from './dto/upload-url.dto';

@ApiTags('photos')
@ApiBearerAuth()
@Controller('photos')
@UseGuards(AuthGuard('jwt'))
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  @Post('upload')
  upload(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateUploadUrlDto) {
    return this.photos.issueUploadUrl(
      user.tenantId,
      user.sub,
      dto.fileName,
      dto.contentType,
      dto.instrumentId,
    );
  }

  @Get(':id')
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const url = await this.photos.getDownloadUrl(user.tenantId, id);
    return { url, expiresIn: 3600 };
  }
}
