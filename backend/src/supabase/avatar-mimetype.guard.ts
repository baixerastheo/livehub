import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import {
  ALLOWED_AVATAR_MIME_TYPES,
  isAllowedAvatarMimeType,
} from './supabase-storage.service';

type RequestWithFile = { file?: { mimetype: string } };

@Injectable()
export class AvatarMimetypeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithFile>();
    const file = request.file;

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!isAllowedAvatarMimeType(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${ALLOWED_AVATAR_MIME_TYPES.join(', ')}`,
      );
    }

    return true;
  }
}
