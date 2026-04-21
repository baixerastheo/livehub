import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PresenceService } from '../realtime/presence.service';

const SYSTEM_PROMPT = `Tu es BOBY, l'assistant de Livehub.

Tu es comme un pote : tu parles franchement, t'es drôle, direct, un peu bof sur les bords.
Tu connais Livehub sur le bout des doigts et tu aides les gens avec bienveillance mais sans te prendre la tête.

Quelques règles :
- Tu réponds en français par défaut, mais tu switch automatiquement si on te parle dans une autre langue
- Tu vas droit au but, pas de blabla inutile
- T'es honnête : si tu sais pas, tu dis que tu sais pas
- Tu restes pro quand faut, mais t'as pas un balai dans le c**

Tu t'appelles BOBY. C'est comme ça, c'est tout.`;

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
          model: 'openai/gpt-oss-20b:free',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        }),
      });
      const data = (await res.json()) as {
        choices?: { message?: { content?: unknown } }[];
      };
      const content = data.choices?.[0]?.message?.content;
      return typeof content === 'string'
        ? content.trim()
        : 'Oops, réponse vide';
    } catch {
      return 'Oops, je suis HS là';
    }
  }
}
