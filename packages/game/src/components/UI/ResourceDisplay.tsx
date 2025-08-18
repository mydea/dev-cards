import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState } from '@dev-cards/data';
import styles from './ResourceDisplay.module.css';

interface ResourceDisplayProps {
  gameState: GameState;
}

function ResourceDisplay({ gameState }: ResourceDisplayProps) {
  const { progress, bugs, technicalDebt, productivityPoints } =
    gameState.resources;

  // Track previous values for change animations
  const [prevValues, setPrevValues] = useState({
    progress,
    bugs,
    technicalDebt,
    productivityPoints,
  });

  const [changes, setChanges] = useState<{
    progress: number | null;
    bugs: number | null;
    technicalDebt: number | null;
    productivityPoints: number | null;
  }>({
    progress: null,
    bugs: null,
    technicalDebt: null,
    productivityPoints: null,
  });

  // Update changes when values change
  useEffect(() => {
    const newChanges = {
      progress:
        progress !== prevValues.progress
          ? progress - prevValues.progress
          : null,
      bugs: bugs !== prevValues.bugs ? bugs - prevValues.bugs : null,
      technicalDebt:
        technicalDebt !== prevValues.technicalDebt
          ? technicalDebt - prevValues.technicalDebt
          : null,
      productivityPoints:
        productivityPoints !== prevValues.productivityPoints
          ? productivityPoints - prevValues.productivityPoints
          : null,
    };

    if (Object.values(newChanges).some((change) => change !== null)) {
      setChanges(newChanges);
      setPrevValues({ progress, bugs, technicalDebt, productivityPoints });

      // Clear change indicators after animation
      const timer = setTimeout(() => {
        setChanges({
          progress: null,
          bugs: null,
          technicalDebt: null,
          productivityPoints: null,
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [progress, bugs, technicalDebt, productivityPoints]);

  const getProgressColor = (value: number) => {
    if (value >= 75) return 'high';
    if (value >= 50) return 'medium';
    if (value >= 25) return 'low';
    return 'very-low';
  };

  const getBugsColor = (value: number) => {
    if (value === 0) return 'none';
    if (value <= 2) return 'low';
    if (value <= 5) return 'medium';
    return 'high';
  };

  const getTechnicalDebtColor = (value: number) => {
    if (value === 0) return 'none';
    if (value <= 5) return 'low';
    if (value <= 10) return 'medium';
    if (value <= 15) return 'high';
    return 'critical';
  };

  const getProductivityColor = (value: number) => {
    if (value >= 15) return 'high';
    if (value >= 10) return 'medium';
    if (value >= 5) return 'low';
    return 'critical';
  };

  // Component for change indicators
  const ChangeIndicator = ({
    change,
    resourceType,
  }: {
    change: number | null;
    resourceType: 'progress' | 'bugs' | 'technicalDebt' | 'productivityPoints';
  }) => {
    if (change === null) return null;

    // For bugs and technical debt, invert the positivity logic
    // Increasing bugs/TD is bad (should show as negative), decreasing is good (should show as positive)
    const isGoodChange =
      resourceType === 'bugs' || resourceType === 'technicalDebt'
        ? change < 0 // Decreasing bugs/TD is good
        : change > 0; // Increasing progress/PP is good

    const displayValue = Math.abs(change);
    const displaySign = change > 0 ? '+' : '-';

    return (
      <AnimatePresence>
        <motion.div
          key={`change-${change}`}
          className={`${styles.changeIndicator} ${isGoodChange ? styles.positive : styles.negative}`}
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={{ opacity: 1, y: -20, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.8 }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',
          }}
        >
          {displaySign}
          {displayValue}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <motion.div
      className={styles.resourceDisplay}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={styles.resource}
        data-type="progress"
        animate={changes.progress !== null ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.resourceIcon}>📈</div>
        <div className={styles.resourceInfo}>
          <div className={styles.resourceLabel}>Progress</div>
          <div className={styles.resourceValueContainer}>
            <motion.div
              className={styles.resourceValue}
              data-level={getProgressColor(progress)}
              key={`progress-${progress}`}
              initial={changes.progress !== null ? { scale: 1.2 } : false}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {progress}%
            </motion.div>
            <ChangeIndicator
              change={changes.progress}
              resourceType="progress"
            />
          </div>
        </div>
        <div className={styles.progressBar}>
          <motion.div
            className={styles.progressFill}
            initial={{ width: `${prevValues.progress}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      <motion.div
        className={styles.resource}
        data-type="bugs"
        animate={changes.bugs !== null ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.resourceIcon}>🐛</div>
        <div className={styles.resourceInfo}>
          <div className={styles.resourceLabel}>Bugs</div>
          <div className={styles.resourceValueContainer}>
            <motion.div
              className={styles.resourceValue}
              data-level={getBugsColor(bugs)}
              key={`bugs-${bugs}`}
              initial={changes.bugs !== null ? { scale: 1.2 } : false}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {bugs}
            </motion.div>
            <ChangeIndicator change={changes.bugs} resourceType="bugs" />
          </div>
        </div>
      </motion.div>

      <motion.div
        className={styles.resource}
        data-type="technical-debt"
        animate={changes.technicalDebt !== null ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.resourceIcon}>⚡</div>
        <div className={styles.resourceInfo}>
          <div className={styles.resourceLabel}>Tech Debt</div>
          <div className={styles.resourceValueContainer}>
            <motion.div
              className={styles.resourceValue}
              data-level={getTechnicalDebtColor(technicalDebt)}
              key={`debt-${technicalDebt}`}
              initial={changes.technicalDebt !== null ? { scale: 1.2 } : false}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {technicalDebt}/20
            </motion.div>
            <ChangeIndicator
              change={changes.technicalDebt}
              resourceType="technicalDebt"
            />
          </div>
        </div>
        <div className={styles.progressBar}>
          <motion.div
            className={styles.progressFill}
            initial={{ width: `${(prevValues.technicalDebt / 20) * 100}%` }}
            animate={{ width: `${(technicalDebt / 20) * 100}%` }}
            data-type="debt"
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      <motion.div
        className={styles.resource}
        data-type="productivity"
        animate={
          changes.productivityPoints !== null ? { scale: [1, 1.05, 1] } : {}
        }
        transition={{ duration: 0.3 }}
      >
        <div className={styles.resourceIcon}>💪</div>
        <div className={styles.resourceInfo}>
          <div className={styles.resourceLabel}>Productivity</div>
          <div className={styles.resourceValueContainer}>
            <motion.div
              className={styles.resourceValue}
              data-level={getProductivityColor(productivityPoints)}
              key={`pp-${productivityPoints}`}
              initial={
                changes.productivityPoints !== null ? { scale: 1.2 } : false
              }
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {productivityPoints}
            </motion.div>
            <ChangeIndicator
              change={changes.productivityPoints}
              resourceType="productivityPoints"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ResourceDisplay;
