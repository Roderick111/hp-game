/**
 * useWitnessInterrogation Hook Tests
 *
 * Tests for witness interrogation state management including:
 * - Loading witnesses
 * - Selecting witness
 * - Asking questions
 * - Presenting evidence
 * - Trust tracking
 * - Secret revelation
 *
 * @module hooks/__tests__/useWitnessInterrogation.test
 * @since Phase 2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWitnessInterrogation } from '../useWitnessInterrogation';
import * as api from '../../api/client';
import type { WitnessInfo, InterrogateResponse, PresentEvidenceResponse } from '../../types/investigation';

// ============================================
// Mocks
// ============================================

vi.mock('../../api/client', () => ({
  getWitnesses: vi.fn(),
  getWitness: vi.fn(),
  interrogateWitness: vi.fn(),
  presentEvidence: vi.fn(),
}));

// ============================================
// Test Data
// ============================================

const mockWitnesses: WitnessInfo[] = [
  {
    id: 'hermione',
    name: 'Hermione Granger',
    trust: 50,
    secrets_revealed: [],
  },
  {
    id: 'draco',
    name: 'Draco Malfoy',
    trust: 30,
    secrets_revealed: ['secret_1'],
  },
];

const mockWitnessDetail: WitnessInfo = {
  id: 'hermione',
  name: 'Hermione Granger',
  personality: 'helpful',
  trust: 55,
  conversation_history: [
    {
      question: 'What happened?',
      response: 'I saw something strange.',
      timestamp: '2026-01-05T12:00:00Z',
      trust_delta: 5,
    },
  ],
  secrets_revealed: [],
};

const mockInterrogateResponse: InterrogateResponse = {
  response: 'I was in the library that night.',
  trust: 60,
  trust_delta: 5,
  secrets_revealed: [],
};

const mockPresentEvidenceResponse: PresentEvidenceResponse = {
  response: 'Where did you find that note?!',
  trust: 65,
  trust_delta: 5,
  secrets_revealed: ['secret_hermione_1'],
};

// ============================================
// Test Suite
// ============================================

describe('useWitnessInterrogation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ------------------------------------------
  // Initial State Tests
  // ------------------------------------------

  describe('Initial State', () => {
    it('returns initial state with empty witnesses', () => {
      const { result } = renderHook(() =>
        useWitnessInterrogation({ autoLoad: false })
      );

      expect(result.current.state.witnesses).toEqual([]);
      expect(result.current.state.currentWitness).toBeNull();
      expect(result.current.state.conversation).toEqual([]);
      expect(result.current.state.trust).toBe(50);
      expect(result.current.state.loading).toBe(false);
      expect(result.current.state.error).toBeNull();
    });

    it('auto-loads witnesses on mount when autoLoad is true', async () => {
      vi.mocked(api.getWitnesses).mockResolvedValue(mockWitnesses);

      const { result } = renderHook(() =>
        useWitnessInterrogation({ autoLoad: true })
      );

      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      }, { timeout: 2000 });

      expect(result.current.state.witnesses).toEqual(mockWitnesses);
      expect(api.getWitnesses).toHaveBeenCalledWith('case_001', 'default');
    });
  });

  // ------------------------------------------
  // Loading Witnesses Tests
  // ------------------------------------------

  describe('Loading Witnesses', () => {
    it('sets loading state while fetching witnesses', async () => {
      let resolvePromise: (value: WitnessInfo[]) => void;
      const promise = new Promise<WitnessInfo[]>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(api.getWitnesses).mockReturnValueOnce(promise);

      const { result } = renderHook(() =>
        useWitnessInterrogation({ autoLoad: true })
      );

      expect(result.current.state.loading).toBe(true);

      act(() => {
        resolvePromise!(mockWitnesses);
      });

      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });
    });

    it('sets error when loading witnesses fails', async () => {
      vi.mocked(api.getWitnesses).mockRejectedValue({
        message: 'Failed to load witnesses',
      });

      const { result } = renderHook(() =>
        useWitnessInterrogation({ autoLoad: true })
      );

      await waitFor(() => {
        expect(result.current.state.error).toBe('Failed to load witnesses');
      }, { timeout: 2000 });
    });

    it('reloads witnesses when reloadWitnesses is called', async () => {
      vi.mocked(api.getWitnesses).mockResolvedValue(mockWitnesses);

      const { result } = renderHook(() =>
        useWitnessInterrogation({ autoLoad: false })
      );

      await act(async () => {
        await result.current.reloadWitnesses();
      });

      await waitFor(() => {
        expect(result.current.state.witnesses).toEqual(mockWitnesses);
      }, { timeout: 2000 });
    });
  });

  // ------------------------------------------
  // Selecting Witness Tests
  // ------------------------------------------

  describe('Selecting Witness', () => {
    it('loads witness details when selectWitness is called', async () => {
      vi.mocked(api.getWitnesses).mockResolvedValueOnce(mockWitnesses);
      vi.mocked(api.getWitness).mockResolvedValueOnce(mockWitnessDetail);

      const { result } = renderHook(() =>
        useWitnessInterrogation({ autoLoad: true })
      );

      await waitFor(() => {
        expect(result.current.state.witnesses.length).toBe(2);
      });

      await act(async () => {
        await result.current.selectWitness('hermione');
      });

      expect(result.current.state.currentWitness).toEqual(mockWitnessDetail);
      expect(result.current.state.trust).toBe(55);
      expect(result.current.state.conversation).toEqual(mockWitnessDetail.conversation_history);
    });

    it('sets error when selecting witness fails', async () => {
      vi.mocked(api.getWitnesses).mockResolvedValueOnce(mockWitnesses);
      vi.mocked(api.getWitness).mockRejectedValueOnce({
        message: 'Witness not found',
      });

      const { result } = renderHook(() =>
        useWitnessInterrogation({ autoLoad: true })
      );

      await waitFor(() => {
        expect(result.current.state.witnesses.length).toBe(2);
      });

      await act(async () => {
        await result.current.selectWitness('invalid');
      });

      expect(result.current.state.error).toBe('Witness not found');
    });
  });

  // ------------------------------------------
  // Asking Questions Tests
  // ------------------------------------------

  describe('Asking Questions', () => {
    it('sends question to API and updates state', async () => {
      vi.mocked(api.getWitnesses).mockResolvedValueOnce(mockWitnesses);
      vi.mocked(api.getWitness).mockResolvedValueOnce(mockWitnessDetail);
      vi.mocked(api.interrogateWitness).mockResolvedValueOnce(mockInterrogateResponse);

      const { result } = renderHook(() =>
        useWitnessInterrogation({ autoLoad: true })
      );

      await waitFor(() => {
        expect(result.current.state.witnesses.length).toBe(2);
      });

      await act(async () => {
        await result.current.selectWitness('hermione');
      });

      await act(async () => {
        await result.current.askQuestion('What did you see?');
      });

      expect(api.interrogateWitness).toHaveBeenCalledWith({
        witness_id: 'hermione',
        question: 'What did you see?',
        case_id: 'case_001',
        player_id: 'default',
      });

      // Check conversation updated
      const lastConversation = result.current.state.conversation[result.current.state.conversation.length - 1];
      expect(lastConversation.question).toBe('What did you see?');
      expect(lastConversation.response).toBe('I was in the library that night.');

      // Check trust updated
      expect(result.current.state.trust).toBe(60);
    });

    it('sets error when no witness is selected', async () => {
      vi.mocked(api.getWitnesses).mockResolvedValueOnce(mockWitnesses);

      const { result } = renderHook(() =>
        useWitnessInterrogation({ autoLoad: true })
      );

      await waitFor(() => {
        expect(result.current.state.witnesses.length).toBe(2);
      });

      await act(async () => {
        await result.current.askQuestion('What did you see?');
      });

      expect(result.current.state.error).toBe('No witness selected');
    });

    it('updates secretsRevealed when secrets are revealed', async () => {
      const responseWithSecrets: InterrogateResponse = {
        response: 'Fine, I will tell you...',
        trust: 70,
        trust_delta: 10,
        secrets_revealed: ['secret_1', 'secret_2'],
      };

      vi.mocked(api.getWitnesses).mockResolvedValueOnce(mockWitnesses);
      vi.mocked(api.getWitness).mockResolvedValueOnce(mockWitnessDetail);
      vi.mocked(api.interrogateWitness).mockResolvedValueOnce(responseWithSecrets);

      const { result } = renderHook(() =>
        useWitnessInterrogation({ autoLoad: true })
      );

      await waitFor(() => {
        expect(result.current.state.witnesses.length).toBe(2);
      });

      await act(async () => {
        await result.current.selectWitness('hermione');
      });

      await act(async () => {
        await result.current.askQuestion('Tell me the truth!');
      });

      expect(result.current.state.secretsRevealed).toContain('secret_1');
      expect(result.current.state.secretsRevealed).toContain('secret_2');
    });
  });

  // ------------------------------------------
  // Presenting Evidence Tests
  // ------------------------------------------

  describe('Presenting Evidence', () => {
    it('presents evidence and updates state', async () => {
      vi.mocked(api.getWitnesses).mockResolvedValueOnce(mockWitnesses);
      vi.mocked(api.getWitness).mockResolvedValueOnce(mockWitnessDetail);
      vi.mocked(api.presentEvidence).mockResolvedValueOnce(mockPresentEvidenceResponse);

      const { result } = renderHook(() =>
        useWitnessInterrogation({ autoLoad: true })
      );

      await waitFor(() => {
        expect(result.current.state.witnesses.length).toBe(2);
      });

      await act(async () => {
        await result.current.selectWitness('hermione');
      });

      await act(async () => {
        await result.current.presentEvidenceToWitness('hidden_note');
      });

      expect(api.presentEvidence).toHaveBeenCalledWith({
        witness_id: 'hermione',
        evidence_id: 'hidden_note',
        case_id: 'case_001',
        player_id: 'default',
      });

      // Check conversation updated with evidence presentation
      const lastConversation = result.current.state.conversation[result.current.state.conversation.length - 1];
      expect(lastConversation.question).toBe('[Presented evidence: hidden_note]');

      // Check secrets revealed
      expect(result.current.state.secretsRevealed).toContain('secret_hermione_1');
    });

    it('sets error when no witness selected for evidence presentation', async () => {
      vi.mocked(api.getWitnesses).mockResolvedValueOnce(mockWitnesses);

      const { result } = renderHook(() =>
        useWitnessInterrogation({ autoLoad: true })
      );

      await waitFor(() => {
        expect(result.current.state.witnesses.length).toBe(2);
      });

      await act(async () => {
        await result.current.presentEvidenceToWitness('hidden_note');
      });

      expect(result.current.state.error).toBe('No witness selected');
    });
  });

  // ------------------------------------------
  // Clear Conversation Tests
  // ------------------------------------------

  describe('Clear Conversation', () => {
    it('clears conversation history', async () => {
      vi.mocked(api.getWitnesses).mockResolvedValueOnce(mockWitnesses);
      vi.mocked(api.getWitness).mockResolvedValueOnce(mockWitnessDetail);

      const { result } = renderHook(() =>
        useWitnessInterrogation({ autoLoad: true })
      );

      await waitFor(() => {
        expect(result.current.state.witnesses.length).toBe(2);
      });

      await act(async () => {
        await result.current.selectWitness('hermione');
      });

      expect(result.current.state.conversation.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearConversation();
      });

      expect(result.current.state.conversation).toEqual([]);
    });
  });

  // ------------------------------------------
  // Custom Options Tests
  // ------------------------------------------

  describe('Custom Options', () => {
    it('uses custom caseId and playerId', async () => {
      vi.mocked(api.getWitnesses).mockResolvedValueOnce(mockWitnesses);

      const { result } = renderHook(() =>
        useWitnessInterrogation({
          caseId: 'case_002',
          playerId: 'player_123',
          autoLoad: true,
        })
      );

      await waitFor(() => {
        expect(result.current.state.witnesses.length).toBe(2);
      });

      expect(api.getWitnesses).toHaveBeenCalledWith('case_002', 'player_123');
    });
  });
});
