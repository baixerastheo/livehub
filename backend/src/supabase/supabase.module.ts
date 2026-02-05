import { Global, Module } from '@nestjs/common';
import { AvatarMimetypeGuard } from './avatar-mimetype.guard';
import { SupabaseStorageService } from './supabase-storage.service';

@Global()
@Module({
  providers: [SupabaseStorageService, AvatarMimetypeGuard],
  exports: [SupabaseStorageService, AvatarMimetypeGuard],
})
export class SupabaseModule {}
