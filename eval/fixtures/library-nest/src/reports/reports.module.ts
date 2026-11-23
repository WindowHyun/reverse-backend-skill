import { Module } from '@nestjs/common';
import { LoansModule } from '../loans/loans.module';
import { ReportsController } from './reports.controller';

@Module({ imports: [LoansModule], controllers: [ReportsController] })
export class ReportsModule {}
