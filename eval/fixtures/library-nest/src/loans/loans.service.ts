import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from './loan.entity';

@Injectable()
export class LoansService {
  constructor(@InjectRepository(Loan) private repo: Repository<Loan>) {}

  create(userId: number, bookId: number) {
    return this.repo.save(this.repo.create({ userId, bookId }));
  }

  forUser(userId: number) {
    return this.repo.findBy({ userId });
  }

  overdue() {
    return this.repo.findBy({ overdue: true });
  }
}
