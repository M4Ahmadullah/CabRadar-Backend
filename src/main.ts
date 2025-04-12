import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

/**
 * Bootstrap function initializes the NestJS application with:
 * - Global validation pipe for request validation
 * - Swagger documentation setup
 * - Server listening on configured port
 */
async function bootstrap() {
  // Create NestJS application instance
  const app = await NestFactory.create(AppModule);

  // Enable global validation for all incoming requests
  app.useGlobalPipes(new ValidationPipe());

  // Configure Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('CabRadar API')
    .setDescription('The CabRadar API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // Setup Swagger documentation at /api endpoint
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start server on configured port (default: 3000)
  await app.listen(process.env.PORT ?? 3000);
}

// Start the application
bootstrap();
