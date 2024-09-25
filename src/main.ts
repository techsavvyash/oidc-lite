import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { KickstartService } from './kickstart/kickstart.service';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.useStaticAssets(join(__dirname, '../', 'public'));
  app.setBaseViewsDir(join(__dirname, '../', 'views'));
  app.setViewEngine('ejs');

  app.enableCors();
  app.use(cookieParser());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OIDC Protocol setup')
    .setDescription('This is the project to implement OIDC protocol in nestjs')
    .setVersion('1.0')
    .build();

  const swagger = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swagger);

  fs.writeFileSync('./swagger.json', JSON.stringify(swagger, null, 2), {
    encoding: 'utf8',
  });

  await app.listen(process.env.HOST_PORT || 3001);
}

bootstrap()
  .then(async () => {
    const kickstartService = new KickstartService();
    await kickstartService.setupService();
    console.log(`Service started at ${process.env.FULL_URL}`);
  })
  .catch((err) => {
    console.error(err);
  });
