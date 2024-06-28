import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class UserDataDto {
  @ApiProperty()
  @MinLength(2, { message: 'Username must be atleast 2 characters' })
  username: string;

  @ApiProperty()
  @IsOptional()
  firstname?: string;

  @ApiProperty()
  @IsOptional()
  lastname?: string;

  @ApiProperty()
  @Matches(
    new RegExp(
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{8,})',
    ),
    {
      message:
        'Password must be atleast 8 characters, with atleast one lowercase, one uppercase, one number and a special character',
    },
  )
  password: string;
}

export class CreateUserDto {
  @ApiProperty()
  @IsBoolean()
  active: boolean;

  @ApiProperty()
  @IsOptional()
  additionalData?: object | string;

  @ApiProperty()
  @IsUUID()
  applicationId: string;

  @ApiProperty()
  @IsString({ each: true })
  membership: string[];

  @ApiProperty()
  @ValidateNested()
  @Type(() => UserDataDto)
  userData: UserDataDto;

  @ApiProperty()
  @IsEmail()
  email: string;
}
export class UpdateUserDto {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty()
  @IsOptional()
  additionalData?: object | string;

  @ApiProperty()
  @IsUUID()
  applicationId: string;

  @ApiProperty()
  @IsOptional()
  @IsString({ each: true })
  membership?: string[];

  @ApiProperty()
  userData: UserDataDto;
}

export class CreateUserRegistrationDto {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  generateAuthenticationToken?: boolean;

  @ApiProperty()
  @IsUUID()
  applicationId: string;

  @ApiProperty()
  @IsOptional()
  data?: string | JSON | object;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  registrationId?: string;

  @ApiProperty()
  @IsString({ each: true })
  roles: string[];
}

export class UpdateUserRegistrationDto {
  @ApiProperty()
  @IsOptional()
  data?: string | JSON | object;

  @ApiProperty()
  @IsOptional()
  @IsString({ each: true })
  roles?: string[];
}

export class CreateUserAndUserRegistration {
  @ApiProperty()
  userInfo: CreateUserDto;

  @ApiProperty()
  registrationInfo: CreateUserRegistrationDto;
}

export class UserDto {
  @IsUUID()
  id: string;

  @IsBoolean()
  active: boolean;

  @IsString()
  data: string;
  expiry: number;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  @IsString()
  tenantId: string;

  @IsUUID()
  groupId: string;

  @IsEmail()
  email: string;
}

export class UserRegistrationData {
  @ApiProperty() code_challenge: string;
  @ApiProperty() code_challenge_method: string;
  @ApiProperty() scope: string;
}

export class UserData {
  @ApiProperty() userData: UserDataDto;
  @ApiProperty() additionalData?: object | string;
}
