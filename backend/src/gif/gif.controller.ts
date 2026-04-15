import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { GifService } from './gif.service';
import { AuthGuard } from '../auth/auth.guard';

/**
 * Controller de gestion des GIFs.
 * Gère les requêtes liées aux GIFs, telles que la récupération des GIFs tendance, la recherche de GIFs, etc.
 */
@UseGuards(AuthGuard)
@Controller('gifs')
export class GifController {
  constructor(private readonly gifService: GifService) {}

  /**
   *
   * @returns Liste des GIFs tendance
   */
  @Get('trending')
  getTrending() {
    return this.gifService.getTrending();
  }

  /**
   * Recherche des GIFs en fonction d'une requête de recherche.
   * @param q - Requête de recherche
   * @returns Liste des GIFs correspondant à la requête
   */
  @Get('search')
  search(@Query('q') q: string) {
    return this.gifService.search(q);
  }

  /**
   * Récupère un GIF par son identifiant.
   * @param id - Identifiant du GIF
   * @returns Détails du GIF correspondant à l'identifiant
   */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.gifService.getById(id);
  }
}
