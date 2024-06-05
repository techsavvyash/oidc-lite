import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Delete,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
} from 'src/dto/application.dto';
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

  @Patch('/:id')
  async updateApplication(
    @Param('id') id: string,
    @Body('data') data: UpdateApplicationDto,
  ) {
    return await this.applicationService.patchApplication(id, data);
  }

  @Delete('/:id')
  async deleteApplication(
    @Param('id') id: string,
    @Query('hardDelete') hardDelete: boolean,
  ) {
    return await this.applicationService.deleteApplication(id,hardDelete);
  }
}
