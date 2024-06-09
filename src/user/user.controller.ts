import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Headers,
  Query,
  Param,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  CreateUserRegistrationDto,
  UpdateUserDto,
  UpdateUserRegistrationDto,
} from 'src/dto/user.dto';
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
import { UserRegistrationService } from './user-registration/user-registration.service';
@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userRegistrationService: UserRegistrationService,
  ) {}

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
    @Param('id') id: string,
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
    @Param('id') id: string,
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
    @Param('id') id: string,
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
    @Param('id') id: string,
    @Headers() headers: object,
    @Query('hardDelete') hardDelete: string,
  ): Promise<ResponseDto> {
    return await this.userService.deleteAUser(id, headers, hardDelete);
  }

  @Post('/registration/:userId')
  async createAUserRegistration(
    @Param('userId') userId: string,
    @Body('data') data: CreateUserRegistrationDto,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.userRegistrationService.createAUserRegistration(
      userId,
      data,
      headers,
    );
  }
  @Get('/registration/:userId/:applicationId')
  async returnAUserRegistration(
    @Param('userId') userId: string,
    @Param('applicationId') applicationId: string,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.userRegistrationService.returnAUserRegistration(
      userId,
      applicationId,
      headers,
    );
  }
  @Patch('/registration/:userId/:applicationId')
  async updateAUserRegistration(
    @Param('userId') userId: string,
    @Param('applicationId') applicationId: string,
    @Body('data') data: UpdateUserRegistrationDto,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.userRegistrationService.updateAUserRegistration(
      userId,
      applicationId,
      data,
      headers,
    );
  }
  @Delete('/registration/:userId/:applicationId')
  async deleteAUserRegistration(
    @Param('userId') userId: string,
    @Param('applicationId') applicationId: string,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.userRegistrationService.deleteAUserRegistration(
      userId,
      applicationId,
      headers,
    );
  }
}
