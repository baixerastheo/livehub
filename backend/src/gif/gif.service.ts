import { BadGatewayException, Injectable } from '@nestjs/common';

/**
 * Service de gestion des GIFs.
 * Fournit des méthodes pour récupérer les GIFs tendance, rechercher des GIFs et obtenir un GIF par son ID.
 */
@Injectable()
export class GifService {
  private readonly baseUrl = process.env.BASE_URL_KLIPY;
  private readonly apiKey = process.env.KLIPY_API_KEY;

  /**
   * Récupère les GIFs tendance.
   * @returns Liste des GIFs tendance
   * @throws BadGatewayException si la récupération échoue
   */
  async getTrending(): Promise<unknown> {
    try {
      const url =
        this.baseUrl + '/' + this.apiKey + '/gifs/trending?page=1&per_page=24';
      const res = await fetch(url);
      return (await res.json()) as unknown;
    } catch {
      throw new BadGatewayException('Failed to fetch trending GIFs');
    }
  }

  /**
   * Recherche des GIFs en fonction d'une requête.
   * @param requete - La requête de recherche
   * @returns Liste des GIFs correspondant à la requête
   * @throws BadGatewayException si la recherche échoue
   */
  async search(requete: string): Promise<unknown> {
    try {
      const url =
        this.baseUrl +
        '/' +
        this.apiKey +
        '/gifs/search?q=' +
        encodeURIComponent(requete) +
        '&page=1&per_page=24';
      const res = await fetch(url);
      return (await res.json()) as unknown;
    } catch {
      throw new BadGatewayException('Failed to search GIFs');
    }
  }

  /**
   * Récupère un GIF par son ID.
   * @param id - L'identifiant du GIF
   * @returns Le GIF correspondant à l'ID
   * @throws BadGatewayException si la récupération échoue
   */
  async getById(id: string): Promise<unknown> {
    try {
      const url = this.baseUrl + '/' + this.apiKey + '/gifs/' + id;
      const res = await fetch(url);
      return (await res.json()) as unknown;
    } catch {
      throw new BadGatewayException('Failed to fetch GIF by ID');
    }
  }
}
