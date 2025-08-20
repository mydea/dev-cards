import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

const HomePage: React.FC = () => {
  return (
    <div className={styles.homePage}>
      <div className={styles.content}>
        <div className={styles.description}>
          <div className={styles.logoContainer}>
            <img
              src="/assets/images/draw-it-play-it-ship-it.png"
              alt="Draw It, Play It, Ship It"
              className={styles.logo}
            />
          </div>
          <p>
            A strategic card game about software development. Manage your
            productivity points, avoid bugs, and tackle technical debt to
            complete your project in the fewest rounds possible.
          </p>
        </div>

        <div className={styles.howToPlay}>
          <h3>How to Play:</h3>
          <div className={styles.ruleSection}>
            <h4>🎯 Objective</h4>
            <p>
              Complete your software project by reaching 100% Progress with 0
              Bugs in the fewest rounds possible.
            </p>
          </div>

          <div className={styles.ruleSection}>
            <h4>🔄 Game Flow</h4>
            <ol>
              <li>
                <strong>Start Round:</strong> Gain Productivity Points (PP)
                equal to (20 - Technical Debt)
              </li>
              <li>
                <strong>Play Cards:</strong> Spend PP to play cards from your
                hand
              </li>
              <li>
                <strong>End Turn:</strong> Discard remaining cards and draw 5
                new ones
              </li>
              <li>
                <strong>Repeat:</strong> Continue until you win or run out of
                cards
              </li>
            </ol>
          </div>

          <div className={styles.ruleSection}>
            <h4>💡 Strategy Tips</h4>
            <ul>
              <li>Balance progress cards with bug fixes and debt reduction</li>
              <li>Some cards have coin flip effects - risk vs reward!</li>
              <li>
                Technical Debt reduces your PP each round - manage it carefully
              </li>
              <li>
                Your score considers rounds, time, and cards played efficiently
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.resources}>
          <div className={styles.resource}>
            <span className={styles.resourceIcon} data-type="progress">
              📈
            </span>
            <div>
              <strong>Progress</strong>
              <br />
              Reach 100% to complete your project
            </div>
          </div>
          <div className={styles.resource}>
            <span className={styles.resourceIcon} data-type="bugs">
              🐛
            </span>
            <div>
              <strong>Bugs</strong>
              <br />
              Must fix all bugs to win
            </div>
          </div>
          <div className={styles.resource}>
            <span className={styles.resourceIcon} data-type="td">
              ⚠️
            </span>
            <div>
              <strong>Technical Debt</strong>
              <br />
              Reduces PP at start of each round
            </div>
          </div>
          <div className={styles.resource}>
            <span className={styles.resourceIcon} data-type="pp">
              ⚡
            </span>
            <div>
              <strong>Productivity Points</strong>
              <br />
              Currency to play cards
            </div>
          </div>
        </div>

        <div className={styles.navigation}>
          <Link to="/game" className={styles.startButton}>
            Start New Game
          </Link>
          <Link to="/leaderboard" className={styles.leaderboardButton}>
            🏆 View Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
