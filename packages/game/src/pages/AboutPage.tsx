import React from 'react';
import { Link } from 'react-router-dom';
import styles from './AboutPage.module.css';

const AboutPage: React.FC = () => {
  return (
    <div className={styles.aboutPage}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <img
              src="/assets/images/draw-it-play-it-ship-it.png"
              alt="Draw It, Play It, Ship It"
              className={styles.logo}
            />
          </div>
          <h1>About the Game</h1>
        </div>

        {/* Main Content */}
        <div className={styles.aboutContent}>
          <section className={styles.section}>
            <h2>🎮 What is Draw It, Play It, Ship It?</h2>
            <p>
              Draw It, Play It, Ship It is a strategic card game that simulates
              the real-world challenges of software development. Players manage
              resources like Productivity Points, Progress, Bugs, and Technical
              Debt while working to complete their project as efficiently as
              possible.
            </p>
            <p>
              Every decision matters - from choosing which development approach
              to take, to deciding when to fix bugs versus pushing forward with
              new features. The game captures the essence of software
              development: the constant balance between speed, quality, and
              technical sustainability.
            </p>
          </section>

          <section className={styles.section}>
            <h2>🎯 Game Design Philosophy</h2>
            <div className={styles.philosophyGrid}>
              <div className={styles.philosophyCard}>
                <h3>⚖️ Realistic Tradeoffs</h3>
                <p>
                  Every development decision involves tradeoffs. Rush a feature
                  and you might introduce bugs. Skip code review and technical
                  debt accumulates. The game reflects these real-world tensions.
                </p>
              </div>
              <div className={styles.philosophyCard}>
                <h3>🎲 Embracing Uncertainty</h3>
                <p>
                  Software development is unpredictable. Coin flip effects
                  simulate the uncertainty we face - sometimes a quick fix works
                  perfectly, sometimes it breaks everything.
                </p>
              </div>
              <div className={styles.philosophyCard}>
                <h3>🚀 Efficiency Rewarded</h3>
                <p>
                  The scoring system rewards players who complete projects with
                  fewer rounds, fewer resources, and less time - just like in
                  real development where efficiency is key.
                </p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>🏆 Competitive Element</h2>
            <p>
              Submit your best scores to the global leaderboard and see how your
              development strategies compare to other players. Can you complete
              the project in the fewest rounds while maintaining code quality?
            </p>
          </section>

          <section className={styles.section}>
            <h2>👨‍💻 Created By</h2>
            <div className={styles.creatorInfo}>
              <p className={styles.creatorText}>
                This game has been created by{' '}
                <strong>Francesco Gringl-Novy</strong> using AI tools.
              </p>
              <div className={styles.aiTools}>
                <div className={styles.aiTool}>
                  <strong>🎨 Images:</strong> Created with OpenAI
                </div>
                <div className={styles.aiTool}>
                  <strong>💻 Code:</strong> Written with Cursor
                </div>
                <div className={styles.aiTool}>
                  <strong>📋 Rules:</strong> Written with Gemini
                </div>
              </div>
              <div className={styles.githubLink}>
                <a
                  href="https://github.com/mydea/draw-it-play-it-ship-it"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.githubButton}
                >
                  📁 View Source Code on GitHub
                </a>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>🛠️ Built With</h2>
            <div className={styles.techStack}>
              <div className={styles.techItem}>
                <strong>Frontend:</strong> React + TypeScript + Vite
              </div>
              <div className={styles.techItem}>
                <strong>Backend:</strong> Cloudflare Workers + Hono + D1
                Database
              </div>
              <div className={styles.techItem}>
                <strong>Animations:</strong> Framer Motion
              </div>
              <div className={styles.techItem}>
                <strong>Monitoring:</strong> Sentry
              </div>
            </div>
          </section>
        </div>

        {/* Navigation */}
        <div className={styles.navigation}>
          <Link to="/" className={styles.homeButton}>
            🏠 Back to Home
          </Link>
          <Link to="/game" className={styles.playButton}>
            🚀 Play Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
