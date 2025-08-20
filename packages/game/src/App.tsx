import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { HomePage, GamePage, LeaderboardPage, NewGamePage } from './pages';
import ScrollToTop from './components/ScrollToTop';
import styles from './App.module.css';

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <Router>
        <ScrollToTop />
        <div className={styles.app}>
          <main className={styles.main}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/game" element={<GamePage />} />
              <Route path="/new-game" element={<NewGamePage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
            </Routes>
          </main>

          <footer className={styles.footer}>
            <p>
              Manage your bugs, technical debt, and productivity to complete
              your project!
            </p>
          </footer>
        </div>
      </Router>
    </Sentry.ErrorBoundary>
  );
}

function ErrorFallback() {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <h1>🚨 Something went wrong!</h1>
        <p>
          The game encountered an unexpected error. Don't worry, we've been
          notified and are working on a fix.
        </p>
        <div className={styles.errorActions}>
          <button onClick={() => window.location.reload()} type="button">
            🔄 Reload Page
          </button>
          <button onClick={() => (window.location.href = '/')} type="button">
            🏠 Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
