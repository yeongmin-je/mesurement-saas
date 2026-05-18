import { BadGatewayException, Body, Controller, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { RecognitionOrchestrator } from './orchestrator.service';
import { CertificateOcrService } from './certificate.service';
import { RecognizeInstrumentDto } from './dto/recognize-instrument.dto';
import { RecognizeCertificateDto } from './dto/recognize-certificate.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(AuthGuard('jwt'))
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class AiController {
  constructor(
    private readonly orchestrator: RecognitionOrchestrator,
    private readonly certificateOcr: CertificateOcrService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('recognize-instrument')
  async recognize(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RecognizeInstrumentDto,
  ) {
    try {
      return await this.orchestrator.recognize(user.tenantId, dto.photoIds);
    } catch (err) {
      throw new BadGatewayException(err instanceof Error ? err.message : 'AI 인식 실패');
    }
  }

  @Post('recognize-certificate')
  async recognizeCertificate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RecognizeCertificateDto,
  ) {
    const photos = await this.prisma.instrumentPhoto.findMany({
      where: { id: { in: dto.photoIds }, tenantId: user.tenantId },
    });
    if (photos.length === 0) throw new NotFoundException('업로드된 사진을 찾을 수 없습니다');

    try {
      return await this.certificateOcr.extract(photos.map((p) => p.s3Key));
    } catch (err) {
      throw new BadGatewayException(err instanceof Error ? err.message : 'OCR 실패');
    }
  }
}
