import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  apiClient,
  type LeaderboardEntry,
  type LeaderboardStatsResponse,
} from '../services/api';
import styles from './LeaderboardPage.module.css';

const LeaderboardPage: React.FC = () => {
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
      <div className={styles.leaderboardPage}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.leaderboardPage}>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>Error Loading Leaderboard</h2>
            <p>{error}</p>
            <div className={styles.actions}>
              <button onClick={loadLeaderboard} className={styles.retryButton}>
                Try Again
              </button>
              <Link to="/" className={styles.homeButton}>
                Back to Menu
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.leaderboardPage}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>🏆 Leaderboard</h1>
          <Link to="/" className={styles.backButton}>
            ← Back to Menu
          </Link>
        </motion.div>

        {stats && (
          <motion.div
            className={styles.stats}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.total_games}</span>
              <span className={styles.statLabel}>Total Games</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.total_players}</span>
              <span className={styles.statLabel}>Players</span>
            </div>
          </motion.div>
        )}

        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {entries.length === 0 ? (
            <div className={styles.empty}>
              <p>No games recorded yet. Be the first to submit a score!</p>
              <Link to="/game" className={styles.playButton}>
                Start Playing
              </Link>
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
                    className={`${styles.tableRow} ${
                      selectedPlayer === entry.player_name
                        ? styles.selected
                        : ''
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.05, duration: 0.3 }}
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
        </motion.div>

        <motion.div
          className={styles.footer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Link to="/game" className={styles.playButton}>
            Play Game
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
