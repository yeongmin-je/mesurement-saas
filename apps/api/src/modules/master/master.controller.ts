import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('master')
@ApiBearerAuth()
@Controller('master')
@UseGuards(AuthGuard('jwt'))
export class MasterController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('kolas-categories')
  kolasCategories(@Query('q') q?: string, @Query('majorCategory') majorCategory?: string) {
    return this.prisma.kolasCategory.findMany({
      where: {
        majorCategory: majorCategory || undefined,
        subCategory: q ? { contains: q, mode: 'insensitive' } : undefined,
      },
      orderBy: [{ majorCategory: 'asc' }, { subCategory: 'asc' }],
      take: 200,
    });
  }

  @Get('manufacturers')
  manufacturers(@Query('q') q?: string) {
    return this.prisma.manufacturer.findMany({
      where: q
        ? {
            OR: [
              { nameKo: { contains: q, mode: 'insensitive' } },
              { nameEn: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { nameKo: 'asc' },
      take: 200,
    });
  }

  @Get('models')
  models(
    @Query('q') q?: string,
    @Query('manufacturerId') manufacturerId?: string,
  ) {
    return this.prisma.model.findMany({
      where: {
        manufacturerId: manufacturerId ? Number(manufacturerId) : undefined,
        modelName: q ? { contains: q, mode: 'insensitive' } : undefined,
      },
      include: { manufacturer: true },
      orderBy: { modelName: 'asc' },
      take: 200,
    });
  }
}
