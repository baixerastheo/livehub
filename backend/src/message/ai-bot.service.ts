import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PresenceService } from '../realtime/presence.service';
import { ConfigAI } from './configAI';

/** Un message de la conversation envoyé à l'API. */
type Message = { role: 'user' | 'assistant'; content: string };

/** Gère le bot BOBY : initialisation, accès à son ID et génération de réponses via OpenRouter. */
@Injectable()
export class AiBotService implements OnModuleInit {
  private botUserId!: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly presenceService: PresenceService,
  ) {}

  /**
   * Récupère l'ID du compte bot en base et le marque en ligne.
   * Appelé automatiquement par NestJS au démarrage du module.
   */
  async onModuleInit() {
    const bot = await this.prisma.user.findUnique({
      where: { email: 'agent@gmail.com' },
      select: { id: true },
    });
    if (!bot) return;
    this.botUserId = bot.id;
    this.presenceService.increment(bot.id);
  }

  /** Retourne l'ID du bot BOBY. */
  getBotUserId(): string {
    return this.botUserId;
  }

  /**
   * Génère une réponse à partir de l'historique de la conversation.
   * @param messages - Historique des messages (rôle + contenu)
   * @returns La réponse générée, ou un message d'erreur en cas d'échec
   */
  async generateResponse(messages: Message[]): Promise<string> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.OPENROUTER_API_KEY,
        },
        body: JSON.stringify({
          model: ConfigAI.MODEL,
          messages: [
            { role: 'system', content: ConfigAI.SYSTEM_PROMPT },
            ...messages,
          ],
        }),
      });

      if (!res.ok) return 'Oops, je suis HS là';

      const data = (await res.json()) as {
        choices: { message: { content: string } }[];
      };
      return data.choices[0].message.content.trim();
    } catch {
      return 'Oops, je suis HS là';
    }
  }
}
