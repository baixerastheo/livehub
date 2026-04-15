import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';
import { PrismaService } from '../prisma.service';
import { TypeCanal } from '../../generated/prisma/enums';

@Injectable()
export class VoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async generateToken(channelId: number, userId: string) {
    const channel = await this.prisma.canal.findUnique({
      where: { id: channelId },
      include: { serveur: true },
    });

    if (!channel) {
      throw new NotFoundException('Canal not found');
    }

    if (channel.type !== TypeCanal.VOCAL) {
      throw new ForbiddenException('This channel is not a voice channel');
    }

    const member = await this.prisma.membreServeur.findUnique({
      where: {
        userId_serveurId: { userId, serveurId: channel.serveurId },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const url = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !url) {
      throw new Error('LiveKit environment variables are not set');
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: userId,
    });

    token.addGrant({
      roomJoin: true,
      room: `channel-${channelId}`,
      canPublish: true,
      canSubscribe: true,
    });

    return { token: await token.toJwt(), url };
  }
}
