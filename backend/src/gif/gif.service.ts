import { Injectable } from '@nestjs/common';

@Injectable()
export class GifService {
  private readonly baseUrl = process.env.BASE_URL_KLIPY;
  private readonly apiKey = process.env.KLIPY_API_KEY;

  async getTrending(): Promise<unknown> {
    const url =
      this.baseUrl + '/' + this.apiKey + '/gifs/trending?page=1&per_page=24';
    const res = await fetch(url);
    const data: unknown = await res.json();
    return data;
  }

  async search(requete: string): Promise<unknown> {
    const url =
      this.baseUrl +
      '/' +
      this.apiKey +
      '/gifs/search?q=' +
      encodeURIComponent(requete) +
      '&page=1&per_page=24';
    const res = await fetch(url);
    const data: unknown = await res.json();
    return data;
  }

  async getById(id: string): Promise<unknown> {
    const url = this.baseUrl + '/' + this.apiKey + '/gifs/' + id;
    const res = await fetch(url);
    const data: unknown = await res.json();
    return data;
  }
}
