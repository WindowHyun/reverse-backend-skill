import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Book {
  @PrimaryGeneratedColumn() id: number;
  @Column() title: string;
  @Column() author: string;
  @Column({ nullable: true }) coverPath: string;
}
