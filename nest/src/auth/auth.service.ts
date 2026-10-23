import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { HARDCODED_PILOT } from '../common/constants/app.constants';
import { LoginDto } from './dto/login.dto';
import { DataStoreService } from '../data/data-store.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataStoreService: DataStoreService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    if (
      username !== HARDCODED_PILOT.username ||
      password !== HARDCODED_PILOT.password
    ) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const pilotData = this.dataStoreService.getPilot();

    const payload = {
      sub: 'pilot-001',
      username: HARDCODED_PILOT.username,
      name: pilotData.name || HARDCODED_PILOT.name,
      role: HARDCODED_PILOT.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      pilot: {
        username: HARDCODED_PILOT.username,
        name: pilotData.name || HARDCODED_PILOT.name,
        totalFlightHours: pilotData.totalFlightHours || HARDCODED_PILOT.totalFlightHours,
        role: HARDCODED_PILOT.role,
      },
    };
  }
}
