'use client';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import RegistrationForm from '@/components/RegistrationForm';
import ParticlesBackground from '@/components/ParticlesBackground';
import FloatingShapes from '@/components/FloatingShapes';

export default function HomePage() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
      <Header />
      
      {/* Background low-opacity slow floating shapes */}
      <FloatingShapes />
      
      <section className="hero" style={{ position: 'relative' }}>
        {/* Floating particles background inside the hero */}
        <ParticlesBackground />
        
        <div className="hero-content" style={{ position: 'relative', zIndex: 10 }}>
          <motion.h1 
            className="welcome-glow"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            Welcome!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontSize: '1.1rem', opacity: 0.9, marginTop: '8px' }}
          >
            Register your details to join the program.
          </motion.p>
        </div>
      </section>

      <main className="form-section" style={{ position: 'relative', zIndex: 20 }}>
        <RegistrationForm />
      </main>

      <footer className="footer" style={{ position: 'relative', zIndex: 10 }}>
        <p>&copy; {new Date().getFullYear()} upGrad Education Pvt. Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}
