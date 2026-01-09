/**
 * Tests for useInnerVoice Hook (Phase 4)
 *
 * Covers:
 * - Trigger API calls
 * - Message conversion (trigger -> tom_ghost message)
 * - Loading state management
 * - Error handling (404 silent, other errors logged)
 * - 404 response handling (returns null)
 */

import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useInnerVoice } from '../useInnerVoice';
import * as client from '../../api/client';
import type { InnerVoiceTrigger } from '../../types/investigation';

// Mock the API client
vi.mock('../../api/client', () => ({
  checkInnerVoice: vi.fn(),
}));

describe('useInnerVoice Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook initialization', () => {
    it('initializes with default case and player ID', () => {
      const { result } = renderHook(() => useInnerVoice());

      expect(result.current).toHaveProperty('checkTomTrigger');
      expect(result.current).toHaveProperty('loading', false);
      expect(result.current).toHaveProperty('lastTrigger', null);
    });

    it('accepts custom case and player IDs', () => {
      const { result } = renderHook(() =>
        useInnerVoice({ caseId: 'custom_case', playerId: 'player123' })
      );

      expect(result.current).toHaveProperty('checkTomTrigger');
    });
  });

  describe('checkTomTrigger function', () => {
    it('returns null when API returns null (404)', async () => {
      vi.mocked(client.checkInnerVoice).mockResolvedValueOnce(null);

      const { result } = renderHook(() => useInnerVoice());
      const message = await result.current.checkTomTrigger(3);

      expect(message).toBeNull();
    });

    it('converts helpful trigger to tom_ghost message', async () => {
      const trigger: InnerVoiceTrigger = {
        id: 'test_helpful',
        text: 'This is helpful advice',
        type: 'helpful',
        tier: 1,
      };
      vi.mocked(client.checkInnerVoice).mockResolvedValueOnce(trigger);

      const { result } = renderHook(() => useInnerVoice());
      const message = await result.current.checkTomTrigger(2);

      expect(message).toBeDefined();
      expect(message?.type).toBe('tom_ghost');
      expect(message?.text).toBe('This is helpful advice');
      // Type-narrow to access tone
      if (message?.type === 'tom_ghost') {
        expect(message.tone).toBe('helpful');
      }
    });

    it('converts misleading trigger to tom_ghost message', async () => {
      const trigger: InnerVoiceTrigger = {
        id: 'test_misleading',
        text: 'This is misleading',
        type: 'misleading',
        tier: 2,
      };
      vi.mocked(client.checkInnerVoice).mockResolvedValueOnce(trigger);

      const { result } = renderHook(() => useInnerVoice());
      const message = await result.current.checkTomTrigger(3);

      expect(message?.type).toBe('tom_ghost');
      expect(message?.text).toBe('This is misleading');
      // Type-narrow to access tone
      if (message?.type === 'tom_ghost') {
        expect(message.tone).toBe('misleading');
      }
    });

    it('passes evidence count to API', async () => {
      vi.mocked(client.checkInnerVoice).mockResolvedValueOnce(null);

      const { result } = renderHook(() =>
        useInnerVoice({ caseId: 'case_001', playerId: 'player1' })
      );
      await result.current.checkTomTrigger(5);

      expect(client.checkInnerVoice).toHaveBeenCalledWith('case_001', 'player1', 5);
    });

    it('updates loading state during call', async () => {
      vi.mocked(client.checkInnerVoice).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(null), 50);
          })
      );

      const { result } = renderHook(() => useInnerVoice());

      expect(result.current.loading).toBe(false);

      const promise = result.current.checkTomTrigger(2);

      expect(result.current.loading).toBe(true);

      await promise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('stores last trigger on success', async () => {
      const trigger: InnerVoiceTrigger = {
        id: 'test_trigger',
        text: 'Test message',
        type: 'helpful',
        tier: 1,
      };
      vi.mocked(client.checkInnerVoice).mockResolvedValueOnce(trigger);

      const { result } = renderHook(() => useInnerVoice());
      await result.current.checkTomTrigger(2);

      expect(result.current.lastTrigger).toEqual(trigger);
    });

    it('does not store trigger when no trigger returns', async () => {
      vi.mocked(client.checkInnerVoice).mockResolvedValueOnce(null);

      const { result } = renderHook(() => useInnerVoice());
      await result.current.checkTomTrigger(2);

      expect(result.current.lastTrigger).toBeNull();
    });

    it('handles API errors gracefully', async () => {
      const error = new Error('API error');
      vi.mocked(client.checkInnerVoice).mockRejectedValueOnce(error);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useInnerVoice());
      const message = await result.current.checkTomTrigger(2);

      expect(message).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Tom inner voice check failed:', error);

      consoleSpy.mockRestore();
    });

    it('always sets loading to false even on error', async () => {
      vi.mocked(client.checkInnerVoice).mockRejectedValueOnce(new Error('Test error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useInnerVoice());

      expect(result.current.loading).toBe(false);

      await result.current.checkTomTrigger(2);

      expect(result.current.loading).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('Multiple calls', () => {
    it('overwrites last trigger on new call', async () => {
      const trigger1: InnerVoiceTrigger = {
        id: 'trigger1',
        text: 'First',
        type: 'helpful',
        tier: 1,
      };
      const trigger2: InnerVoiceTrigger = {
        id: 'trigger2',
        text: 'Second',
        type: 'misleading',
        tier: 2,
      };

      vi.mocked(client.checkInnerVoice)
        .mockResolvedValueOnce(trigger1)
        .mockResolvedValueOnce(trigger2);

      const { result } = renderHook(() => useInnerVoice());

      await result.current.checkTomTrigger(1);
      expect(result.current.lastTrigger?.id).toBe('trigger1');

      await result.current.checkTomTrigger(2);
      expect(result.current.lastTrigger?.id).toBe('trigger2');
    });

    it('handles rapid sequential calls', async () => {
      const triggers: InnerVoiceTrigger[] = [
        { id: 't1', text: 'First', type: 'helpful', tier: 1 },
        { id: 't2', text: 'Second', type: 'helpful', tier: 1 },
        { id: 't3', text: 'Third', type: 'helpful', tier: 1 },
      ];

      triggers.forEach((t) => {
        vi.mocked(client.checkInnerVoice).mockResolvedValueOnce(t);
      });

      const { result } = renderHook(() => useInnerVoice());

      const promises = [
        result.current.checkTomTrigger(1),
        result.current.checkTomTrigger(2),
        result.current.checkTomTrigger(3),
      ];

      const messages = await Promise.all(promises);

      expect(messages).toHaveLength(3);
      messages.forEach((msg) => {
        expect(msg?.type).toBe('tom_ghost');
      });
    });
  });

  describe('Integration with LocationView', () => {
    it('returns proper Message type for rendering', async () => {
      const trigger: InnerVoiceTrigger = {
        id: 'test',
        text: 'Tom says something',
        type: 'helpful',
        tier: 1,
      };
      vi.mocked(client.checkInnerVoice).mockResolvedValueOnce(trigger);

      const { result } = renderHook(() => useInnerVoice());
      const message = await result.current.checkTomTrigger(2);

      // Message should be renderable by LocationView
      expect(message).toBeDefined();
      expect(message?.type).toBe('tom_ghost');
      expect(typeof message?.text).toBe('string');
      // Type-narrow to access tone
      if (message?.type === 'tom_ghost') {
        expect(['helpful', 'misleading']).toContain(message.tone);
      }
    });
  });
});
