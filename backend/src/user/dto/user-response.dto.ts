import { ApiProperty } from '@nestjs/swagger';
import { StatutUtilisateur } from '../../../generated/prisma/enums';

/**
 * Réponse utilisateur exposée par les GET et POST (create/update).
 * Inclut avatarPath, avatarUpdatedAt et avatarUrl (URL signée pour affichage).
 */
export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false, nullable: true })
  image: string | null;

  @ApiProperty({ enum: StatutUtilisateur })
  statut: StatutUtilisateur;

  @ApiProperty({
    description: 'Chemin de l’avatar dans le storage (bucket privé)',
    required: false,
    nullable: true,
  })
  avatarPath: string | null;

  @ApiProperty({
    description: 'Date de dernière mise à jour de l’avatar (cache bust)',
    required: false,
    nullable: true,
  })
  avatarUpdatedAt: Date | null;

  @ApiProperty({
    description: 'URL signée pour afficher l’avatar (valide 1 h)',
    required: false,
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
