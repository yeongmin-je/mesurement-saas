import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { AiController } from './ai.controller';
import { MatchingService } from './matching.service';
import { RecognitionOrchestrator } from './orchestrator.service';
import { VisionService } from './vision.service';
import { CertificateOcrService } from './certificate.service';

@Module({
  imports: [UploadsModule],
  controllers: [AiController],
  providers: [VisionService, MatchingService, RecognitionOrchestrator, CertificateOcrService],
  exports: [RecognitionOrchestrator, CertificateOcrService],
})
export class AiModule {}
