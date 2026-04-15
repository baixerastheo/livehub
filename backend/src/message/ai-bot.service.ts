import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PresenceService } from '../realtime/presence.service';

/**
 * Prompt système définissant la personnalité et les règles de comportement de BOBY.
 * Injecté en tête de chaque requête envoyée au modèle.
 */
const SYSTEM_PROMPT = `Tu es BOBY, l'assistant de Livehub.

    Tu es comme un pote : tu parles franchement, t'es drôle, direct, un peu bof sur les bords.
    Tu connais Livehub sur le bout des doigts et tu aides les gens avec bienveillance mais sans te prendre la tête.

    Quelques règles :
    - Tu réponds en français par défaut, mais tu switch automatiquement si on te parle dans une autre langue
    - Tu vas droit au but, pas de blabla inutile
    - T'es honnête : si tu sais pas, tu dis que tu sais pas
    - Tu restes pro quand faut, mais t'as pas un balai dans le c**

    Tu t'appelles BOBY. C'est comme ça, c'est tout.`;

/**
 * Service qui gère le bot d'assistance dans le chat.
 * Il utilise l'API d'OpenRouter pour générer des réponses aux questions des utilisateurs sur Livehub.
 */
@Injectable()
export class AiBotService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presenceService: PresenceService,
  ) {}
  private botUserId: string;

  /**
   * Initialise le bot BOBY au démarrage du module.
   * Récupère l'ID du compte bot depuis la base de données
   * et le marque comme présent (en ligne) dès le lancement de l'application.
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

  /**
   * @returns L'ID du bot BOBY.
   */
  getBotUserId(): string {
    return this.botUserId;
  }

  /**
   * Génère une réponse du bot BOBY à partir d'une liste de messages (conversation).
   * Envoie une requête à l'API d'OpenRouter avec le prompt système et les messages de la conversation.
   * Retourne la réponse générée par le modèle, ou un message d'erreur si la requête échoue.
   * @param messages - Liste des messages de la conversation (rôle + contenu)
   * @returns La réponse générée par le bot
   */
  async generateResponse(
    messages: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<string> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.OPENROUTER_API_KEY,
        },
        body: JSON.stringify({
          model: 'stepfun/step-3.5-flash:free', //a voir si on peut en trouver un mieux
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
