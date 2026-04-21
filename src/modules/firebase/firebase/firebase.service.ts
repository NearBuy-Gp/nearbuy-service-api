import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

export interface PushPayload {
  token: string;
  title: string;
  body: string;
  data: Record<string, string>;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App;

  onModuleInit() {
    const raw = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT!, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(raw);

    this.app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    this.logger.log('Firebase Admin initialised');
  }

  async sendPush(payload: PushPayload): Promise<boolean> {
    try {
      await this.app.messaging().send({
        token: payload.token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: { sound: 'default' },
        },
        apns: {
          payload: { aps: { sound: 'default', badge: 1 } },
        },
      });
      return true;
    } catch (err: any) {
      if (err.code === 'messaging/registration-token-not-registered' || err.code === 'messaging/invalid-registration-token') {
        this.logger.warn(`Stale FCM token detected: ${payload.token.slice(0, 20)}...`);
        throw new StaleFcmTokenError(payload.token);
      }
      this.logger.error('FCM send failed', err);
      throw err;
    }
  }

  async sendMulticast(tokens: string[], title: string, body: string, data: Record<string, string>): Promise<admin.messaging.BatchResponse> {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
      data,
      android: { priority: 'high' },
    };
    return this.app.messaging().sendEachForMulticast(message);
  }
}

export class StaleFcmTokenError extends Error {
  constructor(public readonly token: string) {
    super('Stale FCM token');
  }
}
