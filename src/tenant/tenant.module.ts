import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { HeaderAuthService } from 'src/header-auth/header-auth.service';
import { TenantController } from './tenant.controller';

@Module({
  imports: [],
  providers: [TenantService, PrismaService, HeaderAuthService],
  controllers: [TenantController],
})
export class TenantModule {}
