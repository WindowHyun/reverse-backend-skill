import { Controller, Get } from '@nestjs/common';
import { Role } from '../common/role.enum';
import { Roles } from '../common/roles.decorator';
import { LoansService } from '../loans/loans.service';

@Controller('reports')
export class ReportsController {
  constructor(private loans: LoansService) {}

  @Roles(Role.Admin)
  @Get('overdue')
  overdue() {
    return this.loans.overdue();
  }
}
