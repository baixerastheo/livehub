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
   * Initialise et retourne le client Supabase.
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
   * Génère un chemin unique pour un fichier dans le bucket.
   * @param prefix - Préfixe du dossier (ex: 'user', 'server')
   * @param id - Identifiant de la ressource
   * @param ext - Extension du fichier
   * @returns Chemin au format 'prefix-id/uuid.ext'
   */
  buildPath(prefix: string, id: string, ext: string): string {
    return prefix + '-' + id + '/' + randomUUID() + '.' + ext;
  }

  /**
   * Upload un fichier vers un chemin dans Supabase Storage.
   * @param path - Chemin de destination dans le bucket
   * @param buffer - Contenu du fichier
   * @param contentType - Type MIME du fichier
   * @returns Chemin du fichier uploadé
   * @throws InternalServerErrorException si l'upload échoue
   */
  async upload(path: string,buffer: Buffer,contentType: string): Promise<string> {
    const client = this.getClient();

    const { data, error } = await client.storage
      .from(this.getBucket())
      .upload(path, buffer, { contentType, upsert: true });

    if (error) {
      throw new InternalServerErrorException(
        'Supabase Storage upload failed:' + error.message,
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
        'Supabase Storage remove failed:' + error.message,
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
        'Supabase Storage signed URL failed:' + error.message,
      );
    }

    return data.signedUrl;
  }

  /**
   * Retourne l'URL publique d'un avatar depuis son path Supabase.
   * Retourne null si le path est absent ou si la génération échoue.
   * @param avatarPath - Chemin dans le bucket (ou null)
   */
  async resolveAvatarUrl(avatarPath: string | null): Promise<string | null> {
    if (!avatarPath) return null;
    try {
      return await this.publicUrl(avatarPath);
    } catch {
      return null;
    }
  }
}
