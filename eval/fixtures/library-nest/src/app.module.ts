import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BooksModule } from './books/books.module';
import { CatalogModule } from './catalog/catalog.module';
import { LoansModule } from './loans/loans.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({ type: 'postgres', url: process.env.DATABASE_URL, autoLoadEntities: true, synchronize: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    BullModule.forRoot({ redis: process.env.REDIS_URL }),
    AuthModule,
    UsersModule,
    BooksModule,
    CatalogModule,
    LoansModule,
    PaymentsModule,
    ReportsModule,
    AdminModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
