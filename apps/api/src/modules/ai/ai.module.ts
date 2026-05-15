import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { AiController } from './ai.controller';
import { MatchingService } from './matching.service';
import { RecognitionOrchestrator } from './orchestrator.service';
import { VisionService } from './vision.service';

@Module({
  imports: [UploadsModule],
  controllers: [AiController],
  providers: [VisionService, MatchingService, RecognitionOrchestrator],
  exports: [RecognitionOrchestrator],
})
export class AiModule {}
