import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface RefreshPayload {
  sub: string;
  tenantId: string;
  role: 'admin' | 'manager' | 'operator';
}

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(cfg: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: cfg.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }

  validate(payload: RefreshPayload): RefreshPayload {
    return payload;
  }
}
