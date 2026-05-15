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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';

class CreateDepartmentDto {
  @IsString() @MinLength(1) @MaxLength(100) name!: string;
  @IsOptional() @IsUUID() managerId?: string;
}

class UpdateDepartmentDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) name?: string;
  @IsOptional() @IsUUID() managerId?: string;
}

@ApiTags('departments')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DepartmentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.department.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { name: 'asc' },
      include: { manager: { select: { id: true, name: true } } },
    });
  }

  @Post()
  @Roles('admin', 'manager')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDepartmentDto) {
    return this.prisma.department.create({
      data: { tenantId: user.tenantId, ...dto },
    });
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    // tenant scoping via where clause to prevent cross-tenant mutation
    await this.prisma.department.updateMany({
      where: { id, tenantId: user.tenantId },
      data: dto,
    });
    return this.prisma.department.findUnique({ where: { id } });
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.prisma.department.deleteMany({ where: { id, tenantId: user.tenantId } });
  }
}
