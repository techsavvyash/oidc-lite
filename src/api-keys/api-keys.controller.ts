import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from 'src/dto/apiKey.dto';
import { randomUUID } from 'crypto';

@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('/')
  async createAnApiKeyWithRandomUUID(@Body('data') data: CreateApiKeyDto) {
    const uuid = randomUUID();
    return await this.apiKeysService.createAnApiKey(uuid, data);
  }

  @Post('/:id')
  async createAnApiKey(
    @Param('id') id: string,
    @Body('data') data: CreateApiKeyDto,
  ) {
    return await this.apiKeysService.createAnApiKey(id, data);
  }
  @Get('/:id')
  async returnAnApiKey(@Param('id') id: string) {
    return await this.apiKeysService.returnAnApiKey(id);
  }
  @Patch('/:id')
  async updateAnApiKey(
    @Param('id') id: string,
    @Body('data') data: UpdateApiKeyDto,
  ) {
    return await this.apiKeysService.updateAnApiKey(id, data);
  }
  @Delete('/:id')
  async deleteAnApiKey(@Param('id') id: string) {
    return await this.apiKeysService.deleteAnApiKey(id);
  }
}
