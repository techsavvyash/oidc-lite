import Provider from 'oidc-provider';
import { UUID, randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserDataDto } from 'src/user/user.dto';
import { UtilsService } from 'src/utils/utils.service';

// check and replace with prisma
const store = new Map();
const logins = new Map();

class Account {
  private accountId: UUID | string;
  private profile: UserDataDto & { email: string };
  private static prismaService: PrismaService;
  private static utilsService: UtilsService;
  static {
    this.prismaService = new PrismaService();
  }
  constructor(id, profile) {
    this.accountId = id || randomUUID();
    this.profile = profile;
    store.set(this.accountId, this);
  }

  /**
   * @param use - can either be "id_token" or "userinfo", depending on
   *   where the specific claims are intended to be put in.
   * @param scope - the intended scope, while oidc-provider will mask
   *   claims depending on the scope automatically you might want to skip
   *   loading some claims from external resources etc. based on this detail
   *   or not return them in id tokens but only userinfo and so on.
   */
  async claims(use, scope) {
    // use: id_token userinfo
    if (this.profile) {
      return {
        sub: this.accountId, // it is essential to always return a sub claim
        email: this.profile.email,
        name: this.profile.username,
        firstname: this.profile.firstname,
        lastname: this.profile.lastname,
      };
    }

    // no longer required
    // return {
    //   sub: this.accountId, // it is essential to always return a sub claim

    //   address: {
    //     country: '000',
    //     formatted: '000',
    //     locality: '000',
    //     postal_code: '000',
    //     region: '000',
    //     street_address: '000',
    //   },
    //   birthdate: '1987-10-16',
    //   email: 'johndoe@example.com',
    //   email_verified: false,
    //   family_name: 'Doe',
    //   gender: 'male',
    //   given_name: 'John',
    //   locale: 'en-US',
    //   middle_name: 'Middle',
    //   name: 'John Doe',
    //   nickname: 'Johny',
    //   phone_number: '+49 000 000000',
    //   phone_number_verified: false,
    //   picture: 'http://lorempixel.com/400/200/',
    //   preferred_username: 'johnny',
    //   profile: 'https://johnswebsite.com',
    //   updated_at: 1454704946,
    //   website: 'http://example.com',
    //   zoneinfo: 'Europe/Berlin',
    // };
  }

  // idk
  static async findByFederated(provider, claims) {
    const id = `${provider}.${claims.sub}`;
    if (!logins.get(id)) {
      logins.set(id, new Account(id, claims));
    }
    return logins.get(id);
  }

  // idk
  static async findByLogin(login) {
    if (!logins.get(login)) {
      logins.set(login, new Account(login, null));
    }

    return logins.get(login);
  }

  static async findAccount(
    ctx: Provider,
    id: string,
    token, // check this token before using clientId,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: { email: id },
    }); // user registration?

    if (!user) return undefined;
    const userData: UserDataDto = JSON.parse(user.data);
    const now = new Date();

    // console.log(ctx.req,ctx.request);
    // const userRegistration = await this.prismaService.userRegistration.upsert({
    //   where: {
    //     user_registrations_uk_1: {
    //       applicationsId: token.clientId,
    //       usersId: user.id,
    //     },
    //   },
    //   update: {
    //     lastLoginInstant: now.toUTCString(),
    //   },
    //   create: {
    //     password: await this.utilsService.hashPassword(userData.password),
    //     applicationsId: token.clientId,
    //     usersId: user.id,
    //     lastLoginInstant: now.toUTCString(),
    //   },
    // });
    // console.log(userRegistration);
    delete userData.password;
    if (!store.get(id)) new Account(id, { ...userData, email: user.email }); // eslint-disable-line no-new
    return store.get(id);
  }
}

export default Account;
