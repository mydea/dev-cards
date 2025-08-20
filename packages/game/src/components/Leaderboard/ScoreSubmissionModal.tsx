import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { GameState } from '@dev-cards/data';
import { apiClient, type SubmitScoreRequest } from '../../services/api';
import styles from './ScoreSubmissionModal.module.css';

interface ScoreSubmissionModalProps {
  gameState: GameState;
  onClose: () => void;
  onSuccess: () => void;
}

const ScoreSubmissionModal: React.FC<ScoreSubmissionModalProps> = ({
  gameState,
  onClose,
  onSuccess,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim()) {
      setError('Please enter a player name');
      return;
    }

    if (playerName.trim().length < 2) {
      setError('Player name must be at least 2 characters');
      return;
    }

    if (playerName.trim().length > 50) {
      setError('Player name must be 50 characters or less');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Prepare score data
    const scoreData: SubmitScoreRequest = {
      player_name: playerName.trim(),
      score: gameState.stats.finalScore || 0,
      rounds: gameState.stats.currentRound,
      final_progress: gameState.resources.progress,
      final_bugs: gameState.resources.bugs,
      final_tech_debt: gameState.resources.technicalDebt,
      game_duration_seconds: Math.round(
        (gameState.stats.endTime! - gameState.stats.startTime) / 1000
      ),
      cards_played: gameState.stats.cardsPlayed
        ? Object.keys(gameState.stats.cardsPlayed)
        : [],
    };

    try {
      const response = await apiClient.submitScore(scoreData);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(response.error || 'Failed to submit score');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setIsSubmitting(false);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (success) {
    return (
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <div className={styles.successContent}>
            <motion.div
              className={styles.successIcon}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              🎉
            </motion.div>
            <h2>Score Submitted!</h2>
            <p>Your score has been added to the leaderboard.</p>
            <div className={styles.submittedScore}>
              <strong>{gameState.stats.finalScore} points</strong>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className={styles.header}>
          <h2>🏆 Submit Your Score</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.scorePreview}>
          <div className={styles.finalScore}>
            {gameState.stats.finalScore} points
          </div>
          <div className={styles.scoreStats}>
            <div className={styles.scoreStat}>
              <span>🏆 Rounds:</span> {gameState.stats.currentRound}
            </div>
            <div className={styles.scoreStat}>
              <span>🃏 Cards Played:</span> {gameState.stats.cardsPlayed}
            </div>
            <div className={styles.scoreStat}>
              <span>⏱️ Time:</span>{' '}
              {formatDuration(
                gameState.stats.endTime! - gameState.stats.startTime
              )}
            </div>
            <div className={styles.scoreStat}>
              <span>📈 Progress:</span> {gameState.resources.progress}%
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="playerName" className={styles.label}>
              Player Name
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className={styles.input}
              maxLength={50}
              disabled={isSubmitting}
              autoFocus
            />
            <div className={styles.inputHint}>
              This name will appear on the leaderboard
            </div>
          </div>

          {error && (
            <motion.div
              className={styles.error}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || !playerName.trim()}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner}></span>
                  Submitting...
                </>
              ) : (
                'Submit Score'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ScoreSubmissionModal;
