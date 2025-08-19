import type {
  GameHistoryEntry,
  GameResources,
  EffectResolution,
} from '../types';

/**
 * Manages game history as a separate mutable state
 */
export class GameHistory {
  private entries: GameHistoryEntry[] = [];

  /**
   * Add a new history entry
   */
  addEntry(
    action: GameHistoryEntry['action'],
    _description: string,
    stateBefore: GameResources,
    stateAfter: GameResources,
    round: number,
    cardId?: string,
    effectResolutions?: EffectResolution[]
  ): void {
    const entry: GameHistoryEntry = {
      round,
      action,
      stateBefore,
      stateAfter,
      timestamp: Date.now(),
      cardId,
      effectResolutions,
    };

    this.entries.push(entry);
  }

  /**
   * Get all history entries
   */
  getEntries(): readonly GameHistoryEntry[] {
    return this.entries;
  }

  /**
   * Get entries for a specific round
   */
  getEntriesForRound(round: number): readonly GameHistoryEntry[] {
    return this.entries.filter((entry) => entry.round === round);
  }

  /**
   * Check if any cards have been played since the start of the current round
   */
  hasPlayedCardThisRound(currentRound: number): boolean {
    // Find the most recent round_start entry
    let roundStartIndex = -1;
    for (let i = this.entries.length - 1; i >= 0; i--) {
      if (
        this.entries[i].action === 'round_start' &&
        this.entries[i].round === currentRound
      ) {
        roundStartIndex = i;
        break;
      }
    }

    // If no round_start found, check from the beginning
    const searchStartIndex = roundStartIndex === -1 ? 0 : roundStartIndex + 1;

    // Look for any card_played entries since the round started
    for (let i = searchStartIndex; i < this.entries.length; i++) {
      if (this.entries[i].action === 'card_played') {
        return true;
      }
    }

    return false;
  }

  /**
   * Clear all history (for new games)
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Get history length
   */
  get length(): number {
    return this.entries.length;
  }
}
