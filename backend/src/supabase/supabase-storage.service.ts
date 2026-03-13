import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Service de gestion du stockage Supabase.
 * Gère l'upload, la suppression et la génération d'URLs signées pour les avatars.
 */
@Injectable()
export class SupabaseStorageService {
  private client: SupabaseClient;

  constructor(private readonly config: ConfigService) {}

  /**
   * Initialise et retourne le client Supabase (lazy loading).
   * @returns Le client Supabase
   * @throws InternalServerErrorException si les variables d'environnement sont absentes
   */
  private getClient(): SupabaseClient {
    if (!this.client) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        throw new InternalServerErrorException(
          'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use Supabase Storage.',
        );
      }
      this.client = createClient(url, key) as SupabaseClient;
    }
    return this.client;
  }

  /**
   * Retourne le nom du bucket de stockage.
   * @returns Nom du bucket (par défaut: 'avatars')
   */
  private getBucket(): string {
    return process.env.SUPABASE_STORAGE_BUCKET ?? 'avatars';
  }

  /**
   * Génère un chemin unique pour un avatar.
   * @param userId - Identifiant de l'utilisateur
   * @param ext - Extension du fichier
   * @returns Chemin au format 'user-userId/uuid.ext'
   */
  buildAvatarPath(userId: string, ext: string): string {
    return `user-${userId}/${randomUUID()}.${ext}`;
  }

  /**
   * Upload un avatar vers Supabase Storage.
   * @param userId - Identifiant de l'utilisateur
   * @param buffer - Contenu du fichier
   * @param contentType - Type MIME du fichier
   * @param ext - Extension du fichier
   * @returns Chemin du fichier uploadé
   * @throws InternalServerErrorException si l'upload échoue
   */
  async uploadAvatar(
    userId: string,
    buffer: Buffer,
    contentType: string,
    ext: string,
  ): Promise<string> {
    const path = this.buildAvatarPath(userId, ext);
    const client = this.getClient();

    const { data, error } = await client.storage
      .from(this.getBucket())
      .upload(path, buffer, { contentType, upsert: true });

    if (error) {
      throw new InternalServerErrorException(
        `Supabase Storage upload failed: ${error.message}`,
      );
    }

    return data.path;
  }

  /**
   * Supprime des fichiers du stockage Supabase.
   * @param paths - Liste des chemins à supprimer
   * @throws InternalServerErrorException si la suppression échoue
   */
  async removeObjects(paths: string[]): Promise<void> {
    if (paths.length === 0) return;

    const client = this.getClient();
    const { error } = await client.storage.from(this.getBucket()).remove(paths);

    if (error) {
      throw new InternalServerErrorException(
        `Supabase Storage remove failed: ${error.message}`,
      );
    }
  }

  /**
   * Génère une URL signée temporaire pour accéder à un fichier.
   * @param path - Chemin du fichier
   * @param expiresIn - Durée de validité en secondes (défaut: 3600)
   * @returns URL signée pour accéder au fichier
   * @throws InternalServerErrorException si la génération échoue
   */
  async publicUrl(path: string, expiresIn = 3600): Promise<string> {
    const client = this.getClient();

    const { data, error } = await client.storage
      .from(this.getBucket())
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new InternalServerErrorException(
        `Supabase Storage signed URL failed: ${error.message}`,
      );
    }

    return data.signedUrl;
  }
}
