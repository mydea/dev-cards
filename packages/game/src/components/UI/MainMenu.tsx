import React from 'react';
import styles from './MainMenu.module.css';

interface MainMenuProps {
  onStartGame: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  return (
    <div className={styles.menu}>
      <div className={styles.content}>
        <div className={styles.description}>
          <h2>Welcome to Dev-Cards!</h2>
          <p>
            A strategic card game about software development. Manage your
            productivity points, avoid bugs, and tackle technical debt to
            complete your project in the fewest rounds possible.
          </p>
        </div>

        <div className={styles.howToPlay}>
          <h3>Quick Rules:</h3>
          <ul>
            <li>
              <strong>Productivity Points (PP):</strong> Start each round with
              20 PP minus Technical Debt
            </li>
            <li>
              <strong>Playing Cards:</strong> Use PP to play cards and gain
              progress
            </li>
            <li>
              <strong>Win Condition:</strong> Reach 100% progress with 0 bugs
            </li>
            <li>
              <strong>Score:</strong> Fewer rounds = better score
            </li>
          </ul>
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

        <button className={styles.startButton} onClick={onStartGame}>
          Start New Game
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
