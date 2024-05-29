import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import {urlencoded} from "body-parser";
import { resolve } from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.useStaticAssets(resolve('./src/public'));
  app.setBaseViewsDir(resolve('./src/views'));
  app.setViewEngine('ejs');
  app.enableCors();
  app.use(cookieParser());
  app.use(bodyParser.json());

  app.use('/interaction', urlencoded({ extended: false }));


  const config = new DocumentBuilder()
    .setTitle('OIDC Protocol setup')
    .setDescription('This is the project to implement OIDC protocol in nestjs')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  // saving the swagger file 
  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document, null, 2), { encoding: 'utf8' });

  await app.listen(3000);
}
bootstrap();
