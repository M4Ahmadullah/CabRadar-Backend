import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { RedisModule } from '../redis/redis.module';
import { FIREBASE_ADMIN } from './constants';
import * as admin from 'firebase-admin';

@Module({
  imports: [RedisModule],
  providers: [
    {
      provide: FIREBASE_ADMIN,
      useValue: (() => {
        if (!admin.apps.length) {
          return admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(
                /\\n/g,
                '\n',
              ),
            }),
          });
        }
        return admin.apps[0];
      })(),
    },
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
