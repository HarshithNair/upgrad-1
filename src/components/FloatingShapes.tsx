'use client';
import { motion } from 'framer-motion';

export default function FloatingShapes() {
  const shapes = [
    { size: 120, x: '10%', y: '15%', delay: 0, duration: 25 },
    { size: 180, x: '80%', y: '20%', delay: 2, duration: 30 },
    { size: 90, x: '75%', y: '70%', delay: 4, duration: 22 },
    { size: 150, x: '15%', y: '80%', delay: 1, duration: 28 },
    { size: 200, x: '45%', y: '40%', delay: 3, duration: 35 },
  ];

  return (
    <div className="floating-shapes-container">
      {shapes.map((s, idx) => (
        <motion.div
          key={idx}
          className="floating-shape"
          style={{
            width: s.size,
            height: s.size,
            left: s.x,
            top: s.y,
          }}
          animate={{
            x: [0, 30, -30, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
