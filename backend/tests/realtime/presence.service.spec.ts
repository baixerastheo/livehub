import { Test } from '@nestjs/testing';
import { PresenceService } from '../../src/realtime/presence.service';

describe('PresenceService', () => {
  let service: PresenceService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PresenceService],
    }).compile();

    service = module.get<PresenceService>(PresenceService);
  });

  describe('increment', () => {
    it('should return true on first connection (was offline)', () => {
      const result = service.increment('user-1');
      expect(result).toBe(true);
    });

    it('should return false on subsequent connections (was already online)', () => {
      service.increment('user-1');
      const result = service.increment('user-1');
      expect(result).toBe(false);
    });

    it('should track different users independently', () => {
      expect(service.increment('user-A')).toBe(true);
      expect(service.increment('user-B')).toBe(true);
      expect(service.increment('user-A')).toBe(false);
    });
  });

  describe('decrement', () => {
    it('should return true when last connection is closed (now offline)', () => {
      service.increment('user-1');
      const result = service.decrement('user-1');
      expect(result).toBe(true);
    });

    it('should return false when user still has other connections', () => {
      service.increment('user-1');
      service.increment('user-1');
      const result = service.decrement('user-1');
      expect(result).toBe(false);
    });

    it('should handle decrement on unknown user without crash', () => {
      const result = service.decrement('unknown-user');
      expect(result).toBe(true);
    });

    it('should remove user from map after last decrement', () => {
      service.increment('user-1');
      service.decrement('user-1');
      expect(service.isOnline('user-1')).toBe(false);
    });
  });

  describe('isOnline', () => {
    it('should return false for a user with no connections', () => {
      expect(service.isOnline('user-1')).toBe(false);
    });

    it('should return true after increment', () => {
      service.increment('user-1');
      expect(service.isOnline('user-1')).toBe(true);
    });

    it('should return false after all connections are closed', () => {
      service.increment('user-1');
      service.increment('user-1');
      service.decrement('user-1');
      service.decrement('user-1');
      expect(service.isOnline('user-1')).toBe(false);
    });

    it('should return true if at least one connection remains', () => {
      service.increment('user-1');
      service.increment('user-1');
      service.decrement('user-1');
      expect(service.isOnline('user-1')).toBe(true);
    });
  });
});
