import { BadRequestException, Body, Controller, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors, Version } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '../common/role.enum';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';

@Controller('books')
export class BooksController {
  constructor(private books: BooksService) {}

  @Get()
  list() {
    return this.books.list();
  }

  @Version('2')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.books.findOne(+id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  create(@Body() dto: CreateBookDto) {
    return this.books.create(dto);
  }

  @Post(':id/cover')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2_000_000 },
      fileFilter: (req, file, cb) =>
        file.mimetype.startsWith('image/') ? cb(null, true) : cb(new BadRequestException('images only'), false),
    }),
  )
  uploadCover(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.books.setCover(+id, `covers/${id}-${Date.now()}`);
  }
}
