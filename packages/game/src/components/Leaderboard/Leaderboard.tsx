import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  apiClient,
  type LeaderboardEntry,
  type LeaderboardStatsResponse,
} from '../../services/api';
import styles from './Leaderboard.module.css';

interface LeaderboardProps {
  onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
    loadStats();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    const response = await apiClient.getLeaderboard(50, 0);

    if (response.success && response.data) {
      setEntries(response.data.entries);
    } else {
      setError(response.error || 'Failed to load leaderboard');
    }

    setLoading(false);
  };

  const loadStats = async () => {
    const response = await apiClient.getLeaderboardStats();
    if (response.success && response.data) {
      setStats(response.data);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  if (loading) {
    return (
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className={styles.modal}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading leaderboard...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className={styles.modal}>
          <div className={styles.error}>
            <h2>Error Loading Leaderboard</h2>
            <p>{error}</p>
            <div className={styles.actions}>
              <button onClick={loadLeaderboard} className={styles.retryButton}>
                Try Again
              </button>
              <button onClick={onClose} className={styles.closeButton}>
                Close
              </button>
            </div>
          </div>
        </div>
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
          <h2>🏆 Leaderboard</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        {stats && (
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.total_games}</span>
              <span className={styles.statLabel}>Total Games</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.total_players}</span>
              <span className={styles.statLabel}>Players</span>
            </div>
          </div>
        )}

        <div className={styles.content}>
          {entries.length === 0 ? (
            <div className={styles.empty}>
              <p>No games recorded yet. Be the first to submit a score!</p>
            </div>
          ) : (
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div className={styles.rank}>Rank</div>
                <div className={styles.player}>Player</div>
                <div className={styles.score}>Score</div>
                <div className={styles.rounds}>Rounds</div>
                <div className={styles.duration}>Time</div>
                <div className={styles.date}>Date</div>
              </div>

              <div className={styles.tableBody}>
                {entries.map((entry, index) => (
                  <motion.div
                    key={entry.game_id}
                    className={`${styles.tableRow} ${selectedPlayer === entry.player_name ? styles.selected : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() =>
                      setSelectedPlayer(
                        selectedPlayer === entry.player_name
                          ? null
                          : entry.player_name
                      )
                    }
                  >
                    <div className={styles.rank}>
                      <span className={styles.medal}>
                        {getRankMedal(entry.rank)}
                      </span>
                    </div>
                    <div className={styles.player}>
                      <span className={styles.playerName}>
                        {entry.player_name}
                      </span>
                    </div>
                    <div className={styles.score}>
                      <span className={styles.scoreValue}>{entry.score}</span>
                    </div>
                    <div className={styles.rounds}>{entry.rounds}</div>
                    <div className={styles.duration}>
                      {formatDuration(entry.game_duration_seconds)}
                    </div>
                    <div className={styles.date}>
                      {formatDate(entry.completed_at)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.closeButton}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Leaderboard;
