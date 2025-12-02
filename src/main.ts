import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
    dotenv.config();
    const app = await NestFactory.create(AppModule);
    const port = process.env.PORT || 3000;
    
    // FIX: Update CORS to allow requests from your new Vercel frontend.
    // If you know your Vercel URL (e.g., https://mboard-123.vercel.app),
    // replace the list below with your specific URL(s).
    // Allowing '*' is generally only for testing public APIs.
    const allowedOrigins = [
        'https://nextjs-aut.onrender.com', // Original origin
        'http://localhost:3000', // For local testing
        /\.vercel\.app$/, // Allows any Vercel domain (e.g., your deployed URL)
    ];

    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.some(pattern => 
                (typeof pattern === 'string' && origin === pattern) || 
                (pattern instanceof RegExp && pattern.test(origin))
            )) {
                callback(null, true);
            } else {
                callback(new Error(`Not allowed by CORS: ${origin}`));
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    
    await app.listen(port);
    console.log(`server listening on: http://localhost:${port}`);
}
bootstrap();
