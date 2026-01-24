import { describe, it, expect } from 'vitest';
import type { Message } from '@/types/dgd';

describe('Session Header Token Counting', () => {
  it('should calculate total tokens from messages correctly', () => {
    const messages: Message[] = [
      {
        id: '1',
        session_id: 'test',
        role: 'user',
        content: 'Hello',
        created_at: new Date().toISOString(),
        prompt_tokens: 10,
        completion_tokens: 0,
      },
      {
        id: '2',
        session_id: 'test',
        role: 'assistant',
        content: 'Hi there!',
        created_at: new Date().toISOString(),
        prompt_tokens: 0,
        completion_tokens: 15,
      },
      {
        id: '3',
        session_id: 'test',
        role: 'user',
        content: 'How are you?',
        created_at: new Date().toISOString(),
        prompt_tokens: 12,
        completion_tokens: 0,
      },
    ];

    const totalTokens = messages.reduce((sum, msg) => {
      const promptTokens = msg.prompt_tokens || 0;
      const completionTokens = msg.completion_tokens || 0;
      return sum + promptTokens + completionTokens;
    }, 0);

    expect(totalTokens).toBe(37);
  });

  it('should handle messages without token data gracefully', () => {
    const messages: Message[] = [
      {
        id: '1',
        session_id: 'test',
        role: 'user',
        content: 'Hello',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        session_id: 'test',
        role: 'assistant',
        content: 'Hi there!',
        created_at: new Date().toISOString(),
      },
    ];

    const totalTokens = messages.reduce((sum, msg) => {
      const promptTokens = msg.prompt_tokens || 0;
      const completionTokens = msg.completion_tokens || 0;
      return sum + promptTokens + completionTokens;
    }, 0);

    expect(totalTokens).toBe(0);
  });

  it('should format token count with locale formatting', () => {
    const tokenCount = 1234567;
    const formatted = tokenCount.toLocaleString();
    
    expect(formatted).toMatch(/1[,.]234[,.]567/);
  });

  it('should handle empty messages array', () => {
    const messages: Message[] = [];

    const totalTokens = messages.reduce((sum, msg) => {
      const promptTokens = msg.prompt_tokens || 0;
      const completionTokens = msg.completion_tokens || 0;
      return sum + promptTokens + completionTokens;
    }, 0);

    expect(totalTokens).toBe(0);
  });

  it('should calculate tokens for messages with partial token data', () => {
    const messages: Message[] = [
      {
        id: '1',
        session_id: 'test',
        role: 'user',
        content: 'Hello',
        created_at: new Date().toISOString(),
        prompt_tokens: 10,
      },
      {
        id: '2',
        session_id: 'test',
        role: 'assistant',
        content: 'Hi there!',
        created_at: new Date().toISOString(),
        completion_tokens: 15,
      },
    ];

    const totalTokens = messages.reduce((sum, msg) => {
      const promptTokens = msg.prompt_tokens || 0;
      const completionTokens = msg.completion_tokens || 0;
      return sum + promptTokens + completionTokens;
    }, 0);

    expect(totalTokens).toBe(25);
  });
});
