import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { err, ok, Result } from '../result.js';
import { publicUserSelect } from '../user/public-user.js';

function orderPair(a: number, b: number): { userAId: number; userBId: number } {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

export type FriendsErrorCode =
  | 'SELF'
  | 'USER_NOT_FOUND'
  | 'ALREADY_FRIENDS'
  | 'REQUEST_PENDING'
  | 'REQUEST_NOT_FOUND'
  | 'REQUEST_NOT_PENDING'
  | 'NOT_ALLOWED'
  | 'UNKNOWN';

export type FriendsError = { code: FriendsErrorCode; message: string };

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  async listFriends(userId: number) {
    const rows = await this.prisma.amitie.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { select: publicUserSelect },
        userB: { select: publicUserSelect },
      },
    });

    return rows.map((r) => (r.userAId === userId ? r.userB : r.userA));
  }

  async listRequests(userId: number) {
    return this.prisma.demandeAmi.findMany({
      where: {
        statut: 'EN_ATTENTE',
        OR: [{ deId: userId }, { aId: userId }],
      },
      include: {
        de: { select: publicUserSelect },
        a: { select: publicUserSelect },
      },
      orderBy: { creeLe: 'desc' },
    });
  }

  async sendRequest(
    fromUserId: number,
    toUserId: number,
  ): Promise<Result<void, FriendsError>> {
    if (fromUserId === toUserId) {
      return err({ code: 'SELF', message: 'Cannot send a friend request to yourself' });
    }

    const toUser = await this.prisma.utilisateur.findUnique({
      where: { id: toUserId },
      select: { id: true },
    });
    if (!toUser) return err({ code: 'USER_NOT_FOUND', message: 'User not found' });

    const { userAId, userBId } = orderPair(fromUserId, toUserId);
    const existingFriendship = await this.prisma.amitie.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
      select: { id: true },
    });
    if (existingFriendship) {
      return err({ code: 'ALREADY_FRIENDS', message: 'Already friends' });
    }

    const existingRequest = await this.prisma.demandeAmi.findUnique({
      where: { pairAId_pairBId: { pairAId: userAId, pairBId: userBId } },
    });
    if (existingRequest?.statut === 'EN_ATTENTE') {
      return err({ code: 'REQUEST_PENDING', message: 'Friend request already pending' });
    }

    if (!existingRequest) {
      await this.prisma.demandeAmi.create({
        data: {
          pairAId: userAId,
          pairBId: userBId,
          deId: fromUserId,
          aId: toUserId,
          statut: 'EN_ATTENTE',
        },
      });
    } else {
      // REFUSEE/ACCEPTEE: allow re-send only if declined.
      if (existingRequest.statut === 'ACCEPTEE') {
        return err({ code: 'ALREADY_FRIENDS', message: 'Already friends' });
      }
      await this.prisma.demandeAmi.update({
        where: { id: existingRequest.id },
        data: {
          deId: fromUserId,
          aId: toUserId,
          statut: 'EN_ATTENTE',
        },
      });
    }

    return ok(undefined);
  }

  async acceptRequest(
    requestId: string,
    currentUserId: number,
  ): Promise<Result<void, FriendsError>> {
    const request = await this.prisma.demandeAmi.findUnique({
      where: { id: requestId },
    });
    if (!request) return err({ code: 'REQUEST_NOT_FOUND', message: 'Request not found' });
    if (request.statut !== 'EN_ATTENTE') {
      return err({ code: 'REQUEST_NOT_PENDING', message: 'Request is not pending' });
    }
    if (request.aId !== currentUserId) {
      return err({ code: 'NOT_ALLOWED', message: 'Not allowed' });
    }

    const { userAId, userBId } = orderPair(request.deId, request.aId);

    try {
      await this.prisma.$transaction([
        this.prisma.demandeAmi.update({
          where: { id: requestId },
          data: { statut: 'ACCEPTEE' },
        }),
        this.prisma.amitie.create({
          data: { userAId, userBId },
        }),
      ]);
    } catch {
      return err({ code: 'UNKNOWN', message: 'Unable to accept request' });
    }

    return ok(undefined);
  }

  async declineRequest(
    requestId: string,
    currentUserId: number,
  ): Promise<Result<void, FriendsError>> {
    const request = await this.prisma.demandeAmi.findUnique({
      where: { id: requestId },
    });
    if (!request) return err({ code: 'REQUEST_NOT_FOUND', message: 'Request not found' });
    if (request.statut !== 'EN_ATTENTE') {
      return err({ code: 'REQUEST_NOT_PENDING', message: 'Request is not pending' });
    }
    if (request.aId !== currentUserId) {
      return err({ code: 'NOT_ALLOWED', message: 'Not allowed' });
    }

    await this.prisma.demandeAmi.update({
      where: { id: requestId },
      data: { statut: 'REFUSEE' },
    });

    return ok(undefined);
  }
}

