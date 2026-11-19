import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from './loan.entity';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { LoansTasks } from './loans.tasks';

@Module({
  imports: [TypeOrmModule.forFeature([Loan])],
  controllers: [LoansController],
  providers: [LoansService, LoansTasks],
  exports: [LoansService],
})
export class LoansModule {}
