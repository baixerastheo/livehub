import { Injectable } from '@nestjs/common';


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
    * @throws Error si la récupération échoue
   */
  async getTrending(){
    try {const url = this.baseUrl + '/' + this.apiKey + '/gifs/trending?page=1&per_page=24';
      const res = await fetch(url);
      return await res.json();
    } catch {
      throw new Error('Failed to fetch trending GIFs');
    }
  }


  /**
   * Recherche des GIFs en fonction d'une requête.
   * @param requete - La requête de recherche
   * @return Liste des GIFs correspondant à la requête
   * @throws Error si la recherche échoue
   */
  async search(requete: string) {
    try {
      const url = this.baseUrl + '/' + this.apiKey + '/gifs/search?q=' + encodeURIComponent(requete) + '&page=1&per_page=24';
      const res = await fetch(url);
      return await res.json();
    } catch {
      throw new Error('Failed to search gifs');
    }
  }

  /**
   * Récupère un GIF par son ID.
   * @param id - L'identifiant du GIF
   * @return Le GIF correspondant à l'ID
   * @throws Error si la récupération échoue
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
