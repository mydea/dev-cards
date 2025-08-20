import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage, GamePage, LeaderboardPage } from './pages';
import styles from './App.module.css';

function App() {
  return (
    <Router>
      <div className={styles.app}>
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </main>

        <footer className={styles.footer}>
          <p>
            Manage your bugs, technical debt, and productivity to complete your
            project!
          </p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
