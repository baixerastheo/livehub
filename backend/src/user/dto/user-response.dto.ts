import { StatutUtilisateur } from '../../../generated/prisma/enums';

/**
 * Réponse utilisateur exposée par les GET et POST (create/update).
 * Inclut avatarPath, avatarUpdatedAt et avatarUrl (URL signée pour affichage).
 */
export class UserResponseDto {
  id: string;

  name: string;

  email: string;

  image: string | null;

  statut: StatutUtilisateur;

  avatarPath: string | null;

  avatarUpdatedAt: Date | null;

  avatarUrl: string | null;

  createdAt: Date;

  updatedAt: Date;
}
