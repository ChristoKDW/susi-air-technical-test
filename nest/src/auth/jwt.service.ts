import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { JWT_SECRET } from '../common/constants/app.constants';

@Injectable()
export class JwtService {
  private readonly secret: string = JWT_SECRET;

  async signAsync(
    payload: any,
    options?: { secret?: string; expiresIn?: number | string },
  ): Promise<string> {
    const secret = options?.secret || this.secret;
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 7 * 24 * 3600; // 7 days expiration
    const fullPayload = { ...payload, iat: now, exp };
    const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    return `${header}.${body}.${signature}`;
  }

  async verifyAsync<T = any>(token: string, options?: { secret?: string }): Promise<T> {
    const secret = options?.secret || this.secret;
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSig) {
      throw new Error('Invalid JWT signature');
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('JWT token has expired');
    }

    return payload as T;
  }
}
