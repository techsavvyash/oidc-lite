import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from 'src/dto/application.dto';
import { randomUUID } from 'crypto';

@Controller('application')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get('/')
  async allApplications() {
    return await this.applicationService.returnAllApplications();
  }

  @Get('/:id')
  async getAnApplication(@Param('id') id: string) {
    return await this.applicationService.returnAnApplication(id);
  }

  @Post('/')
  async insertAnApplicationWithRandomUUID(
    @Body('data') data: CreateApplicationDto,
  ) {
    const uuid = randomUUID();
    return await this.applicationService.createApplication(uuid, data);
  }

  @Post('/:id')
  async insertAnApplication(
    @Body('data') data: CreateApplicationDto,
    @Param('id') id: string,
  ) {
    return await this.applicationService.createApplication(id, data);
  }

  // update later
  @Patch('/:id')
  async updateApplication(@Param('id') id: string) {
    return await this.applicationService.patchApplication(id, 'FOR NOW!');
  }
}
