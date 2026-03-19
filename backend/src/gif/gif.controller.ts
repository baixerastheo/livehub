import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { GifService } from './gif.service';
import { AuthGuard } from '../auth/auth.guard';

/**
 * Contrôleur gérant les endpoints liés aux GIFs.
 * Toutes les routes sont protégées par l'AuthGuard.
 */
@UseGuards(AuthGuard)
@Controller('gifs')
export class GifController {
  constructor(private readonly gifService: GifService) {}

  /**
   * Récupère les GIFs tendance du moment.
   * @returns Liste des GIFs tendance
   */
  @Get('trending')
  getTrending() {
    return this.gifService.getTrending();
  }

  /**
   * Recherche des GIFs selon un mot-clé.
   * @param q - Le terme de recherche
   * @returns Liste des GIFs correspondant à la recherche
   */
  @Get('search')
  search(@Query('q') q: string) {
    return this.gifService.search(q);
  }

  /**
   * Récupère un GIF spécifique par son identifiant.
   * @param id - L'identifiant unique du GIF
   * @returns Le GIF correspondant à l'ID
   */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.gifService.getById(id);
  }
}