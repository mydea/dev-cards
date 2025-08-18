import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ParticleEffect.module.css';

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  delay: number;
  duration: number;
  scale: number;
  rotation: number;
}

interface ParticleEffectProps {
  isActive: boolean;
  type: 'celebration' | 'warning';
  onComplete?: () => void;
}

function ParticleEffect({ isActive, type, onComplete }: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    const celebrationEmojis = ['🎉', '🎊', '✨', '🎈', '🏆', '💫', '🌟', '⭐'];
    const warningEmojis = ['⚠️', '🚨', '💥', '🔥', '⚡'];

    const emojis = type === 'celebration' ? celebrationEmojis : warningEmojis;
    const particleCount = type === 'celebration' ? 20 : 10;

    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        scale: 0.8 + Math.random() * 0.4,
        rotation: Math.random() * 360,
      });
    }

    setParticles(newParticles);

    // Clean up after animation
    const timeout = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 4000);

    return () => clearTimeout(timeout);
  }, [isActive, type, onComplete]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className={styles.particleContainer}>
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={styles.particle}
            initial={{
              opacity: 0,
              scale: 0,
              x: particle.x,
              y: particle.y,
              rotate: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, particle.scale, particle.scale * 0.8, 0],
              y: particle.y - 100 - Math.random() * 200,
              x: particle.x + (Math.random() - 0.5) * 200,
              rotate: particle.rotation + (Math.random() - 0.5) * 180,
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: 'easeOut',
            }}
          >
            {particle.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ParticleEffect;
