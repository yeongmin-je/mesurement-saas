import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { AuthResponse } from '@metroai/types';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenDenylistService } from './token-denylist.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
    private readonly denylist: TokenDenylistService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('이미 가입된 이메일입니다');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const { tenant, user } = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { name: dto.tenantName } });
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email,
          passwordHash,
          name: dto.name,
          phone: dto.phone,
          role: 'admin', // The first user of a tenant becomes admin.
        },
      });
      return { tenant, user };
    });

    return this.issueTokens(user.id, tenant.id, user.role, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'manager' | 'operator',
      tenantId: tenant.id,
    });
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(user.id, user.tenantId, user.role, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'manager' | 'operator',
      tenantId: user.tenantId,
    });
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; jti?: string; exp?: number }>(
        refreshToken,
        { secret: this.cfg.getOrThrow<string>('JWT_REFRESH_SECRET') },
      );
      if (payload.jti && this.denylist.isRevoked(payload.jti)) {
        throw new UnauthorizedException('리프레시 토큰이 폐기되었습니다');
      }
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();

      // Rotation: revoke the old refresh token so it can't be reused.
      if (payload.jti && payload.exp) {
        this.denylist.revoke(payload.jti, payload.exp * 1000);
      }

      return this.issueTokens(user.id, user.tenantId, user.role, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'admin' | 'manager' | 'operator',
        tenantId: user.tenantId,
      });
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다');
    }
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = await this.jwt.verifyAsync<{ jti?: string; exp?: number }>(refreshToken, {
        secret: this.cfg.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.jti && payload.exp) {
        this.denylist.revoke(payload.jti, payload.exp * 1000);
      }
    } catch {
      // expired/invalid token — nothing to revoke, treat as success
    }
  }

  private async issueTokens(
    userId: string,
    tenantId: string,
    role: string,
    user: AuthResponse['user'],
  ): Promise<AuthResponse> {
    const payload = { sub: userId, tenantId, role };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.jwt.signAsync(
      { ...payload, jti: randomUUID() },
      {
        secret: this.cfg.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.cfg.get<string>('JWT_REFRESH_EXPIRES_IN', '14d'),
      },
    );
    return { user, accessToken, refreshToken };
  }
}
