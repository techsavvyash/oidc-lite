import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Headers,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from 'src/dto/user.dto';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiHeader,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { ResponseDto } from 'src/dto/response.dto';
@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Create a user with a random UUID' })
  @ApiBody({ type: CreateUserDto, description: 'User data' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiHeader({ name: 'authorization', description: 'Authorization token' })
  @Post('/')
  async createAUserWithRandomUUID(
    @Body() data: CreateUserDto,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    const id = randomUUID();
    return await this.userService.createAUser(id, data, headers);
  }

  @ApiOperation({ summary: 'Create a user with a specific ID' })
  @ApiBody({ type: CreateUserDto, description: 'User data' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiHeader({ name: 'authorization', description: 'Authorization token' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Post('/:id')
  async createAUser(
    @Query('id') id: string,
    @Body() data: CreateUserDto,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.userService.createAUser(id, data, headers);
  }

  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully retrieved.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiHeader({ name: 'authorization', description: 'Authorization token' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Get('/:id')
  async returnAUser(
    @Query('id') id: string,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.userService.returnAUser(id, headers);
  }

  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiBody({ type: UpdateUserDto, description: 'User data to update' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiHeader({ name: 'authorization', description: 'Authorization token' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Patch('/:id')
  async updateAUser(
    @Query('id') id: string,
    @Headers() headers: object,
    @Body() data: CreateUserDto,
  ): Promise<ResponseDto> {
    return await this.userService.updateAUser(id, data, headers);
  }

  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully deleted.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiHeader({ name: 'authorization', description: 'Authorization token' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiQuery({
    name: 'hardDelete',
    description: 'Hard delete flag',
    required: false,
  })
  @Delete('/:id')
  async deleteAUser(
    @Query('id') id: string,
    @Headers() headers: object,
    @Query('hardDelete') hardDelete: string,
  ): Promise<ResponseDto> {
    return await this.userService.deleteAUser(id, headers, hardDelete);
  }
}
