import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { KeyService } from './key.service';
import { generateKeyDTO, updateDTO } from 'src/key/key.dto';
import { randomUUID } from 'crypto';

@ApiTags('Key Management')
@Controller('key')
export class KeyController {
  constructor(private readonly keyservice: KeyService) {}

  @ApiOperation({ summary: 'Retrieve all keys' })
  @ApiResponse({ status: 200, description: 'All keys retrieved successfully' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true,
  })
  @Get('/')
  async retrieveAllKey(@Headers() headers: object) {
    return await this.keyservice.retrieveAllKey(headers);
  }

  @ApiOperation({ summary: 'Retrieve a key by ID' })
  @ApiParam({ name: 'id', description: 'Key ID', required: true })
  @ApiResponse({ status: 200, description: 'Key retrieved successfully' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true,
  })
  @Get('/:id')
  async retrieveUniqueKey(
    @Param('id') uuid: string,
    @Headers() headers: object,
  ) {
    return await this.keyservice.retrieveUniqueKey(uuid, headers);
  }

  @ApiOperation({ summary: 'Update a key by ID' })
  @ApiParam({ name: 'id', description: 'Key ID', required: true })
  @ApiBody({ type: updateDTO })
  @ApiResponse({ status: 200, description: 'Key updated successfully' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true,
  })
  @Put('/:id')
  async udpatingKey(
    @Param('id') uuid: string,
    @Body() data: updateDTO,
    @Headers() headers: object,
  ) {
    return await this.keyservice.updateKey(uuid, data, headers);
  }

  @ApiOperation({ summary: 'Delete a key by ID' })
  @ApiParam({ name: 'id', description: 'Key ID', required: true })
  @ApiResponse({ status: 200, description: 'Key deleted successfully' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true,
  })
  @Delete('/:id')
  async deletingKey(@Param('id') uuid: string, @Headers() headers: object) {
    return await this.keyservice.deleteKey(uuid, headers);
  }

  @ApiOperation({ summary: 'Generate a random key' })
  @ApiBody({ type: generateKeyDTO })
  @ApiResponse({ status: 201, description: 'Key generated successfully' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true,
  })
  @Post('/generate')
  async randomgenerateKey(
    @Body('key') key: generateKeyDTO,
    @Headers() headers: object,
  ) {
    const uuid = randomUUID();
    return await this.keyservice.generateKey(uuid, key, headers);
  }

  @ApiOperation({ summary: 'Generate a key with a specific ID' })
  @ApiParam({ name: 'id', description: 'Key ID', required: true })
  @ApiBody({ type: generateKeyDTO })
  @ApiResponse({ status: 201, description: 'Key generated successfully' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true,
  })
  @Post('/generate/:id')
  async generateKey(
    @Param('id') uuid: string,
    @Body('key') key: generateKeyDTO,
    @Headers() headers: object,
  ) {
    return await this.keyservice.generateKey(uuid, key, headers);
  }
}
