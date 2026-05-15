import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { InstrumentsService } from './instruments.service';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { QueryInstrumentsDto } from './dto/query-instruments.dto';
import { UpdateInstrumentDto } from './dto/update-instrument.dto';
import { DiscardInstrumentDto } from './dto/discard-instrument.dto';
import { CreateMovementDto } from './dto/movement.dto';

@ApiTags('instruments')
@ApiBearerAuth()
@Controller('instruments')
@UseGuards(AuthGuard('jwt'))
export class InstrumentsController {
  constructor(private readonly instruments: InstrumentsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryInstrumentsDto) {
    return this.instruments.list(user.tenantId, query);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInstrumentDto) {
    return this.instruments.create(user.tenantId, user.sub, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.instruments.findById(user.tenantId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInstrumentDto,
  ) {
    return this.instruments.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  discard(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DiscardInstrumentDto,
  ) {
    return this.instruments.discard(user.tenantId, user.sub, id, dto.reason);
  }

  @Post(':id/movements')
  move(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMovementDto,
  ) {
    return this.instruments.createMovement(user.tenantId, user.sub, id, dto);
  }
}
