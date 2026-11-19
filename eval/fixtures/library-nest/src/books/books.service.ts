import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';

@Injectable()
export class BooksService {
  constructor(@InjectRepository(Book) private repo: Repository<Book>) {}

  list() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOneByOrFail({ id });
  }

  create(dto: CreateBookDto) {
    return this.repo.save(this.repo.create(dto));
  }

  bulkInsert(items: Partial<Book>[]) {
    return this.repo.save(items);
  }

  async setCover(id: number, path: string) {
    const book = await this.repo.findOneByOrFail({ id });
    book.coverPath = path;
    return this.repo.save(book);
  }
}
