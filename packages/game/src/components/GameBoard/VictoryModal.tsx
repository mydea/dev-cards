import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { GameState, GameHistory } from '@dev-cards/data';
import { apiClient, type SubmitScoreRequest } from '../../services/api';
import styles from './GameBoard.module.css';

interface VictoryModalProps {
  gameState: GameState;
  history: GameHistory;
  gameOver: {
    isGameOver: boolean;
    won: boolean;
    message: string;
  };
  onReturnToMenu: () => void;
  onShowParticles: () => void;
}

const VictoryModal: React.FC<VictoryModalProps> = ({
  gameState,
  history,
  gameOver,
  onReturnToMenu,
  onShowParticles,
}) => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreSubmissionError, setScoreSubmissionError] = useState<
    string | null
  >(null);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim()) {
      setScoreSubmissionError('Please enter a player name');
      return;
    }

    if (playerName.trim().length < 2) {
      setScoreSubmissionError('Player name must be at least 2 characters');
      return;
    }

    if (playerName.trim().length > 50) {
      setScoreSubmissionError('Player name must be 50 characters or less');
      return;
    }

    setIsSubmittingScore(true);
    setScoreSubmissionError(null);

    // Extract played card IDs from game history
    const playedCardIds = history
      .getEntries()
      .filter((entry) => entry.action === 'card_played' && entry.cardId)
      .map((entry) => entry.cardId!)
      .filter((cardId, index, array) => array.indexOf(cardId) === index); // Remove duplicates

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
      cards_played: playedCardIds,
    };

    try {
      const response = await apiClient.submitScore(scoreData);

      if (response.success) {
        setScoreSubmitted(true);
        onShowParticles(); // Show celebration particles
        setTimeout(() => {
          navigate('/leaderboard');
        }, 2000);
      } else {
        // Handle various error response formats
        const errorMessage = response.error || 'Failed to submit score';
        setScoreSubmissionError(errorMessage);
      }
    } catch (err) {
      console.error('Score submission error:', err);
      setScoreSubmissionError('Network error. Please try again.');
    }

    setIsSubmittingScore(false);
  };

  return (
    <motion.div
      className={styles.gameOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={styles.gameOverContent}
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 25,
            delay: 0.1,
          },
        }}
        exit={{
          opacity: 0,
          scale: 0.8,
          y: 50,
          transition: { duration: 0.2 },
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {gameOver.won ? '🎉 Victory!' : '💥 Game Over'}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {gameOver.message}
        </motion.p>

        {gameOver.won ? (
          <>
            <motion.p
              className={styles.finalScore}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              Final Score: {gameState.stats.finalScore} points
            </motion.p>

            <motion.div
              className={styles.scoreBreakdown}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className={styles.scoreStat}>
                <span>🏆 Rounds:</span> {gameState.stats.currentRound}
              </div>
              <div className={styles.scoreStat}>
                <span>🃏 Cards Played:</span> {gameState.stats.cardsPlayed}
              </div>
              <div className={styles.scoreStat}>
                <span>⏱️ Time:</span>{' '}
                {Math.round(
                  ((gameState.stats.endTime! - gameState.stats.startTime) /
                    1000 /
                    60) *
                    10
                ) / 10}
                m
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div
            className={styles.scoreBreakdown}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className={styles.scoreStat}>
              <span>📊 Rounds Survived:</span> {gameState.stats.currentRound}
            </div>
            <div className={styles.scoreStat}>
              <span>🃏 Cards Played:</span> {gameState.stats.cardsPlayed}
            </div>
            <div className={styles.scoreStat}>
              <span>⏱️ Time Played:</span>{' '}
              {Math.round(
                ((gameState.stats.endTime! - gameState.stats.startTime) /
                  1000 /
                  60) *
                  10
              ) / 10}
              m
            </div>
            <div className={styles.scoreStat}>
              <span>📈 Progress Reached:</span> {gameState.resources.progress}%
            </div>
          </motion.div>
        )}

        {gameOver.won && !scoreSubmitted && (
          <motion.form
            className={styles.scoreSubmissionForm}
            onSubmit={handleScoreSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div
              className={styles.inputGroup}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className={styles.sectionHeader}>
                🏆 Submit to Leaderboard
              </div>
              <label htmlFor="playerName" className={styles.inputLabel}>
                Player Name
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className={styles.nameInput}
                maxLength={50}
                disabled={isSubmittingScore}
                autoFocus
              />
              {scoreSubmissionError && (
                <motion.div
                  className={styles.errorMessage}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {scoreSubmissionError}
                </motion.div>
              )}
            </motion.div>

            <motion.div
              className={styles.submitActions}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <motion.button
                type="submit"
                className={styles.submitScoreButton}
                disabled={isSubmittingScore || !playerName.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                }}
              >
                {isSubmittingScore ? (
                  <>
                    <span className={styles.spinner}></span>
                    Submitting...
                  </>
                ) : (
                  '🏆 Submit Score'
                )}
              </motion.button>
            </motion.div>
          </motion.form>
        )}

        {scoreSubmitted && (
          <motion.div
            className={styles.submissionSuccess}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className={styles.successIcon}>🎉</div>
            <h3>Score Submitted!</h3>
            <p>Redirecting to leaderboard...</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: gameOver.won && !scoreSubmitted ? 0.9 : 0.6,
          }}
          className={styles.gameOverActions}
        >
          <motion.button
            className={styles.newGameButton}
            onClick={() => navigate('/new-game')}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            New Game
          </motion.button>
          <motion.button
            className={styles.menuButton}
            onClick={onReturnToMenu}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            Main Menu
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default VictoryModal;
