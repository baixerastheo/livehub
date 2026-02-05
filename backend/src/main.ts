import './bootstrap-env';

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(new IoAdapter(app));
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('LiveHub API')
    .setDescription('The LiveHub API description')
    .setVersion('1.0')
    .addTag('LiveHub')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  const port = process.env.PORT ?? 4001;
  await app.listen(port);
  console.log('API running at http://localhost:' + port);
  console.log('Swagger docs available at http://localhost:' + port + '/api');
}

bootstrap().catch((err) => {
  console.error('Error while starting Nest application', err);
  process.exit(1);
});
