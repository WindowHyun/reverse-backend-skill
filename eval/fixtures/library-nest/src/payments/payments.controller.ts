import { Controller, Headers, Post, RawBodyRequest, Req, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { Public } from '../common/public.decorator';

@Public()
@Controller('payments')
export class PaymentsController {
  @Post('webhook')
  webhook(@Headers('x-signature') signature: string, @Req() req: RawBodyRequest<Request>) {
    const expected = createHmac('sha256', process.env.WEBHOOK_SECRET).update(req.rawBody).digest('hex');
    if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      throw new UnauthorizedException();
    }
    return { received: true };
  }
}
