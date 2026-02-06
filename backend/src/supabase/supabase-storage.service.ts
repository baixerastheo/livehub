import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Result, ok, err } from '../result';

/**
 * Service de gestion du stockage Supabase.
 * Gère l'upload, la suppression et la génération d'URLs signées pour les avatars.
 */
@Injectable()
export class SupabaseStorageService {
  private client: SupabaseClient

  constructor(private readonly config: ConfigService) {}

  /**
   * Initialise et retourne le client Supabase (lazy loading).
   * @returns Result contenant le client Supabase ou une erreur
   */
  private getClient(): Result<SupabaseClient, Error> {
    if (!this.client) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        return err(
          new Error(
            'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use Supabase Storage.',
          ),
        );
      }
      this.client = createClient(url, key);
    }
    return ok(this.client);
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
   * @returns Chemin au format 'user/userId/uuid.ext'
   */
  buildAvatarPath(userId: string, ext: string): string {
    return 'user-' + userId + '/' + randomUUID() + '.' + ext;
  }

  /**
   * Upload un avatar vers Supabase Storage.
   * @param params - Paramètres d'upload (userId, buffer, contentType, ext)
   * @returns Chemin du fichier uploadé
   * @throws Error si le type MIME n'est pas autorisé ou si l'upload échoue
   */
  async uploadAvatar(userId: string, buffer: Buffer, contentType: string, ext: string) {
    const path = this.buildAvatarPath(userId, ext);
    const bucket = this.getBucket();

    const clientResult = this.getClient();
    if (clientResult.isErr()) {
      return err(clientResult.error);
    }
    const client = clientResult.value;

    const { data, error } = await client.storage.from(bucket).upload(path, buffer, { contentType, upsert: true });

    if (error) {
      return err('Supabase Storage upload failed: ' + error.message);
    }

    return ok(data.path);
  }

  /**
   * Supprime des fichiers du stockage Supabase.
   * @param paths - Liste des chemins à supprimer
   * @throws Error si la suppression échoue
   */
  async removeObjects(paths: string[]) {
    if (paths.length === 0) return;

    const bucket = this.getBucket();

    const clientResult = this.getClient();
    if (clientResult.isErr()) {
      return err(clientResult.error);
    }
    const client = clientResult.value;

    const { error } = await client.storage.from(bucket).remove(paths);

    if (error) {
      return err('Supabase Storage remove failed: ' + error.message);
    }
    return ok(undefined);
  }

  /**
   * Génère une URL signée temporaire pour accéder à un fichier.
   * @param path - Chemin du fichier
   * @param expiresIn - Durée de validité en secondes
   * @returns URL signée pour accéder au fichier
   * @throws Error si la génération échoue
   */
  async publicUrl(path: string, expiresIn = 3600) {
    const bucket = this.getBucket();

    const clientResult = this.getClient();
    if (clientResult.isErr()) {
      return err(clientResult.error);
    }
    const client = clientResult.value;

    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      return err('Supabase Storage signed URL failed: ' + error.message);
    }
    return ok(data.signedUrl);
  }
}
