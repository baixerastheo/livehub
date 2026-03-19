import { Injectable } from '@nestjs/common';

@Injectable()
export class GifService {
  private readonly baseUrl = process.env.BASE_URL_KLIPY;
  private readonly apiKey = process.env.KLIPY_API_KEY;

  /**
   * Récupère les GIFs tendance (page 1, 24 résultats).
   * @returns La réponse JSON de l'API Klipy contenant les GIFs tendance.
   */
  async getTrending(): Promise<unknown> {
    try {
      const url =this.baseUrl + '/' + this.apiKey + '/gifs/trending?page=1&per_page=24';
      const res = await fetch(url);
      return await res.json();
    } catch {
      throw new Error('Failed to fetch trending GIFs');
    }
  }

  /**
   * Recherche des GIFs selon un terme donné (page 1, 24 résultats).
   * @param requete - Le terme de recherche à encoder et envoyer à l'API.
   * @returns La réponse JSON de l'API Klipy contenant les GIFs correspondants.
   */
  async search(requete: string): Promise<unknown> {
    try {
      const url = this.baseUrl + '/' + this.apiKey + '/gifs/search?q=' + encodeURIComponent(requete) + '&page=1&per_page=24';
      const res = await fetch(url);
      return await res.json();
    } catch {
      throw new Error('Failed to search gifs');
    }
  }

  /**
   * Récupère un GIF spécifique par son identifiant.
   * @param id - L'identifiant unique du GIF à récupérer.
   * @returns La réponse JSON de l'API Klipy contenant les données du GIF.
   */
  async getById(id: string): Promise<unknown> {
    try {
      const url = this.baseUrl + '/' + this.apiKey + '/gifs/' + id;
      const res = await fetch(url);
      return await res.json();
    } catch {
      throw new Error('Failed to fetch gif by ID');
    }
  }
}
