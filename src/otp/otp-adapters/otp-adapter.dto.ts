export class MailConfigDTO {
    from: string;
    host: string;
    user: string;
    password: string;
    port: number;
    secure?: boolean;
    ignoreTLS?: boolean;
    requireTLS?: boolean;
}

export class SmsConfigDTO {
    accountSid: string;
    authToken: string;
    from: string;
}

export class WhatsappConfigDTO {
    username2Way: string;
    password2Way: string;
    usernameHSM: string;
    passwordHSM: string;
}