import { Module } from '@nestjs/common';
import { BooksModule } from '../books/books.module';
import { CatalogController } from './catalog.controller';

@Module({ imports: [BooksModule], controllers: [CatalogController] })
export class CatalogModule {}
