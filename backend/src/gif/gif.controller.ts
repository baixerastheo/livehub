import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { GifService } from './gif.service';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('gifs')
export class GifController {
  constructor(private readonly gifService: GifService) {}

  @Get('trending')
  getTrending() {
    return this.gifService.getTrending();
  }

  @Get('search')
  search(
    @Query('q') q: string) {
    return this.gifService.search(q);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.gifService.getById(id);
  }
}
