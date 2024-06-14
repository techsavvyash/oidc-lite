import { ApiProperty } from '@nestjs/swagger';

class Membership {
  @ApiProperty() groupId: string;
}
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
  @ApiProperty() membership: Membership[];
  @ApiProperty() userData: UserData;
  @ApiProperty() email: string;
}
export class UpdateUserDto {
  @ApiProperty() active?: boolean;
  @ApiProperty() additionalData?: object | string;
  @ApiProperty() applicationId: string;
  @ApiProperty() membership?: Membership[];
  @ApiProperty() userData: UserData;
}

export class CreateUserRegistrationDto {
  @ApiProperty() genenrateAuthenticationToken?: boolean;
  @ApiProperty() applicationsId: string;
  @ApiProperty() data?: string | JSON | object;
  @ApiProperty() registrationId?: string;
  @ApiProperty() roles: string[];
}

export class UpdateUserRegistrationDto {
  @ApiProperty() data?: string | JSON | object;
  @ApiProperty() roles?: string[];
}
