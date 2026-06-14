import { IsEnum, IsOptional, IsMongoId } from 'class-validator';

export enum NotificationType {
  RESTOCK = 'RESTOCK',
  BUSINESS_OPEN = 'BUSINESS_OPEN',
  PROXIMITY = 'PROXIMITY',
  BEHAVIORAL = 'BEHAVIORAL',
}

export class SubscribeDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsMongoId()
  businessId?: string;

  @IsOptional()
  @IsMongoId()
  itemId?: string;
}

// Also add to users.service.ts — these two methods are
// called by the processor:

// async getFcmToken(userId: string): Promise<string | null> {
//   const user = await this.userModel.findById(userId).select('fcmToken');
//   return user?.fcmToken ?? null;
// }

// async clearFcmToken(userId: string): Promise<void> {
//   await this.userModel.updateOne({ _id: userId }, { $unset: { fcmToken: 1 } });
// }
