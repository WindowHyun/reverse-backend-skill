import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Loan } from './loan.entity';

@Injectable()
export class LoansTasks {
  constructor(@InjectRepository(Loan) private repo: Repository<Loan>) {}

  @Cron(CronExpression.EVERY_HOUR)
  async markOverdue() {
    await this.repo.update({ dueAt: LessThan(new Date()) }, { overdue: true });
  }
}
