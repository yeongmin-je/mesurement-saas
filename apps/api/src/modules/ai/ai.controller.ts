import { BadGatewayException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { RecognitionOrchestrator } from './orchestrator.service';
import { RecognizeInstrumentDto } from './dto/recognize-instrument.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(AuthGuard('jwt'))
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class AiController {
  constructor(private readonly orchestrator: RecognitionOrchestrator) {}

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
}
