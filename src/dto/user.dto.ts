export class CreateUserDto {
  readonly birthdate: string;
  readonly gender: string;
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly tokens?: string;
}

export class LoginDTO {
  readonly username: string;
  readonly password: string;
  readonly scopes?: string;
}
