import { Module } from '@nestjs/common';
import { KickstartService } from './kickstart.service';

@Module({
  providers: [KickstartService]
})
export class KickstartModule {}
