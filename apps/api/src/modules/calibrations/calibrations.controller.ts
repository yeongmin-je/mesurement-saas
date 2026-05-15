import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { CalibrationsService } from './calibrations.service';
import { CreateCalibrationDto } from './dto/create-calibration.dto';

@ApiTags('calibrations')
@ApiBearerAuth()
@Controller()
@UseGuards(AuthGuard('jwt'))
export class CalibrationsController {
  constructor(private readonly calibrations: CalibrationsService) {}

  @Get('instruments/:instrumentId/calibrations')
  listForInstrument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('instrumentId', ParseUUIDPipe) instrumentId: string,
  ) {
    return this.calibrations.listForInstrument(user.tenantId, instrumentId);
  }

  @Post('instruments/:instrumentId/calibrations')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('instrumentId', ParseUUIDPipe) instrumentId: string,
    @Body() dto: CreateCalibrationDto,
  ) {
    return this.calibrations.create(user.tenantId, user.sub, instrumentId, dto);
  }

  @Delete('calibrations/:id')
  @HttpCode(204)
  async softDelete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.calibrations.softDelete(user.tenantId, id);
  }

  @Get('calibrations/upcoming')
  upcoming(
    @CurrentUser() user: AuthenticatedUser,
    @Query('daysAhead', new ParseIntPipe({ optional: true })) daysAhead?: number,
  ) {
    return this.calibrations.listUpcoming(user.tenantId, daysAhead ?? 30);
  }
}
