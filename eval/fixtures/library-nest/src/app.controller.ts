import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from './common/public.decorator';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class AppController {
  @Public()
  @Get()
  health() {
    return { status: 'ok' };
  }
}
