import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Loan {
  @PrimaryGeneratedColumn() id: number;
  @Column() userId: number;
  @Column() bookId: number;
  @Column({ default: false }) overdue: boolean;
  @Column({ type: 'timestamp', default: () => 'now()' }) dueAt: Date;
}
