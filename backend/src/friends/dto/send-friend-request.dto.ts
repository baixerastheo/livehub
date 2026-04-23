import { IsString, IsUUID } from 'class-validator';

export class SendFriendRequestDto {
  @IsString()
  @IsUUID('4', { message: 'toUserId must be a valid UUID' })
  toUserId!: string;
}
