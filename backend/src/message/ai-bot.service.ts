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


@Injectable()
export class AiBotService implements OnModuleInit {

  /** ID de l'utilisateur bot en base de données */
  private botUserId: string;

  constructor(
    private readonly prisma: PrismaService, private readonly presenceService: PresenceService) {}

  /**
   * Initialisation du service au démarrage du module.
   * Récupère l'ID du compte bot depuis la BDD et le marque comme présent.
   * Si le compte bot n'existe pas, le service s'arrête silencieusement.
   */
  async onModuleInit() {
    const bot = await this.prisma.user.findUnique({
      where: { email: 'agent@gmail.com' },
      select: { id: true },
    });
    if (!bot) return;
    this.botUserId = bot.id;
    this.presenceService.increment(this.botUserId);
  }

  /**
   * Retourne l'ID de l'utilisateur bot.
   * Utilisé pour identifier BOBY dans les conversations.
   * @returns L'ID du bot
   */
  getBotUserId(): string {
    return this.botUserId;
  }

  /**
   * Génère une réponse de BOBY à partir d'un historique de messages.
   * Appelle l'API OpenRouter avec le modèle configuré et le system prompt de BOBY.
   * @param messages - Historique de la conversation (rôles user/assistant + contenu)
   * @returns La réponse générée par le modèle, ou un message d'erreur fallback
   */
  async generateResponse(
    messages: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
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