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


@Injectable()
export class AiBotService implements OnModuleInit {
  private botUserId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly presenceService: PresenceService,
  ) {}

  async onModuleInit() {
    const bot = await this.prisma.user.findUnique({
      where: { email: 'agent@gmail.com' },
      select: { id: true },
    });
    if (!bot) return;
    this.botUserId = bot.id;
    this.presenceService.increment(this.botUserId);
  }

  getBotUserId(): string {
    return this.botUserId;
  }

  async generateResponse(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.OPENROUTER_API_KEY,
        },
        body: JSON.stringify({
          model: 'stepfun/step-3.5-flash:free',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        }),
      });
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      return typeof content === 'string' ? content.trim() : 'Oops, réponse vide';
    } catch (err) {
      return 'Oops, je suis HS là';
    }
  }
}
