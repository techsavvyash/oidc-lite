import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, Matches, MinLength } from 'class-validator';

export class UserData {

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
  @IsEmail()
  email: string;
  
  @ApiProperty() 
  @Matches(
    new RegExp(
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{8,})'
    ),
    { message: 'Password must be atleast 8 characters, with atleast one lowercase, one uppercase, one number and a special character' }
  )
  password: string;
}

export class CreateUserDto {
  @ApiProperty() active: boolean;
  @ApiProperty() additionalData?: object | string;
  @ApiProperty() applicationId: string;
  @ApiProperty() membership: string[];
  @ApiProperty() userData: UserData;
  @ApiProperty() email: string;
}
export class UpdateUserDto {
  @ApiProperty() active?: boolean;
  @ApiProperty() additionalData?: object | string;
  @ApiProperty() applicationId: string;
  @ApiProperty() membership?: string[];
  @ApiProperty() userData: UserData;
}

export class CreateUserRegistrationDto {
  @ApiProperty() generateAuthenticationToken?: boolean;
  @ApiProperty() applicationId: string;
  @ApiProperty() data?: string | JSON | object;
  @ApiProperty() registrationId?: string;
  @ApiProperty() roles: string[];
}

export class UpdateUserRegistrationDto {
  @ApiProperty() data?: string | JSON | object;
  @ApiProperty() roles?: string[];
}

export class CreateUserAndUserRegistration {
  @ApiProperty() userInfo: CreateUserDto;
  @ApiProperty() registrationInfo: CreateUserRegistrationDto;
}

export class UserDto {
  id: string;
  active: boolean;
  data: string;
  expiry: Date;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  groupId: string;
  email: string;
}
