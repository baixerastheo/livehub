import { aggregateReactions } from '../../src/message/message.utils';

describe('aggregateReactions', () => {
  it('should return empty array for empty input', () => {
    expect(aggregateReactions([])).toEqual([]);
  });

  it('should aggregate a single reaction', () => {
    const result = aggregateReactions([{ emoji: '👍', userId: 'user-1' }]);
    expect(result).toEqual([{ emoji: '👍', count: 1, userIds: ['user-1'] }]);
  });

  it('should aggregate multiple users on the same emoji', () => {
    const result = aggregateReactions([
      { emoji: '👍', userId: 'user-1' },
      { emoji: '👍', userId: 'user-2' },
      { emoji: '👍', userId: 'user-3' },
    ]);
    expect(result).toEqual([
      { emoji: '👍', count: 3, userIds: ['user-1', 'user-2', 'user-3'] },
    ]);
  });

  it('should group reactions by emoji', () => {
    const result = aggregateReactions([
      { emoji: '👍', userId: 'user-1' },
      { emoji: '❤️', userId: 'user-2' },
      { emoji: '👍', userId: 'user-3' },
    ]);

    const thumbsUp = result.find((r) => r.emoji === '👍');
    const heart = result.find((r) => r.emoji === '❤️');

    expect(thumbsUp).toEqual({ emoji: '👍', count: 2, userIds: ['user-1', 'user-3'] });
    expect(heart).toEqual({ emoji: '❤️', count: 1, userIds: ['user-2'] });
    expect(result).toHaveLength(2);
  });

  it('should preserve insertion order of emojis', () => {
    const result = aggregateReactions([
      { emoji: '🔥', userId: 'user-1' },
      { emoji: '❤️', userId: 'user-2' },
      { emoji: '👍', userId: 'user-3' },
    ]);

    expect(result[0].emoji).toBe('🔥');
    expect(result[1].emoji).toBe('❤️');
    expect(result[2].emoji).toBe('👍');
  });

  it('should handle many distinct emojis', () => {
    const reactions = ['👍', '❤️', '😂', '😮', '😢', '🔥'].map((emoji, i) => ({
      emoji,
      userId: 'user-' + i,
    }));

    const result = aggregateReactions(reactions);
    expect(result).toHaveLength(6);
    result.forEach((r) => expect(r.count).toBe(1));
  });
});
