import { ApiProperty } from '@nestjs/swagger';

export class UserData {
  @ApiProperty() username: string;
  @ApiProperty() firstname?: string;
  @ApiProperty() lastname?: string;
  @ApiProperty() email: string;
  @ApiProperty() password: string;
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
  expiry: number;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  groupId: string;
  email: string;
}
