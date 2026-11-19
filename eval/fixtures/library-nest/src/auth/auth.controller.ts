import { Body, Controller, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @SkipThrottle()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }
}
