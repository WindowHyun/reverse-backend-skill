import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import axios from 'axios';
import { BooksService } from '../books/books.service';
import { Public } from '../common/public.decorator';

@Public()
@Controller('catalog')
export class CatalogController {
  constructor(private books: BooksService) {}

  @Get()
  list() {
    return this.books.list();
  }

  @Get('preview')
  async preview(@Query('url') url: string) {
    const res = await axios.get(url);
    return res.data;
  }

  @Post('import')
  bulkImport(@Body() items: any[]) {
    return this.books.bulkInsert(items);
  }
}
