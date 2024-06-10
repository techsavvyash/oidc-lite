import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty() birthdate: string;
  @ApiProperty() gender: string;
  @ApiProperty() username: string;
  @ApiProperty() email: string;
  @ApiProperty() password: string;
  @ApiProperty() tokens?: string;
}

export class LoginDTO {
  @ApiProperty() username: string;
  @ApiProperty() password: string;
  @ApiProperty() scopes?: string;
  @ApiProperty() resource?: string;
  @ApiProperty() grant_type?: string;
}
