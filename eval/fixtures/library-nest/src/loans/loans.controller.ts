import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { LoansService } from './loans.service';

@Controller('loans')
export class LoansController {
  constructor(private loans: LoansService) {}

  @Post()
  create(@Body() dto: CreateLoanDto) {
    return this.loans.create(dto.userId, dto.bookId);
  }

  @Get('mine')
  mine(@Req() req) {
    return this.loans.forUser(req.user.id);
  }
}
