import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const ALLOWED_AVATAR_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedAvatarMimeType = (typeof ALLOWED_AVATAR_MIME_TYPES)[number];

export function isAllowedAvatarMimeType(
  contentType: string,
): contentType is AllowedAvatarMimeType {
  return (ALLOWED_AVATAR_MIME_TYPES as readonly string[]).includes(contentType);
}

@Injectable()
export class SupabaseStorageService {
  private client: SupabaseClient | null = null;

  constructor(private readonly config: ConfigService) {}

  private getClient(): SupabaseClient {
    if (!this.client) {
      const url = this.config.get<string>('SUPABASE_URL');
      const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
      if (!url || !key) {
        throw new Error(
          'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use Supabase Storage.',
        );
      }
      this.client = createClient(url, key);
    }
    return this.client;
  }

  private getBucket(): string {
    return this.config.get<string>('SUPABASE_STORAGE_BUCKET') ?? 'avatars';
  }

  buildAvatarPath(userId: string, ext: string): string {
    return `user-${userId}/${randomUUID()}.${ext}`;
  }

  async uploadAvatar(params: {
    userId: string;
    buffer: Buffer;
    contentType: string;
    ext: string;
  }): Promise<{ path: string }> {
    const { userId, buffer, contentType, ext } = params;

    if (!isAllowedAvatarMimeType(contentType)) {
      throw new Error(
        `Invalid avatar contentType: ${contentType}. Allowed: ${ALLOWED_AVATAR_MIME_TYPES.join(', ')}`,
      );
    }

    const path = this.buildAvatarPath(userId, ext);
    const bucket = this.getBucket();

    const { data, error } = await this.getClient()
      .storage.from(bucket)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    return { path: data.path };
  }

  async removeObjects(paths: string[]): Promise<void> {
    if (paths.length === 0) return;

    const bucket = this.getBucket();
    const { error } = await this.getClient().storage.from(bucket).remove(paths);

    if (error) {
      throw new Error(`Supabase Storage remove failed: ${error.message}`);
    }
  }

  async publicUrl(path: string, expiresIn = 3600): Promise<string> {
    const bucket = this.getBucket();
    const { data, error } = await this.getClient()
      .storage.from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Supabase Storage signed URL failed: ${error.message}`);
    }
    return data.signedUrl;
  }
}
