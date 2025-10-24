import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Brain, Target, Zap } from 'lucide-react';

const Marketing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col gradient-overlay">
      {/* Nav */}
      <nav className="border-b border-border bg-bg/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center">
              <Mic className="w-5 h-5 text-bg" />
            </div>
            <span className="text-xl font-bold text-text">Echo</span>
          </div>
          <Button onClick={() => navigate('/dashboard')} className="btn-accent">
            Open App
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center px-6 py-20"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-text via-accent to-accent-2 bg-clip-text text-transparent"
          >
            Never Miss a Deal Signal Again
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-subtext mb-12 max-w-2xl mx-auto"
          >
            Echo is your real-time discovery call copilot. Capture every insight, coach reps live, and win more deals
            with AI-powered guidance.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex gap-4 justify-center"
          >
            <Button size="lg" onClick={() => navigate('/dashboard')} className="btn-accent text-lg px-8">
              Launch Demo
            </Button>
            <Button size="lg" variant="outline" className="border-border text-text hover:bg-muted">
              Watch Video
            </Button>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20"
          >
            <div className="card-elevated p-6 text-left">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-Time Guidance</h3>
              <p className="text-subtext text-sm">
                Get live suggestions on what to ask next based on your framework and conversation context.
              </p>
            </div>
            <div className="card-elevated p-6 text-left">
              <div className="w-12 h-12 rounded-lg bg-accent-2/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-accent-2" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Framework Coverage</h3>
              <p className="text-subtext text-sm">
                Track MEDDPICC, BANT, or custom frameworks automatically as the conversation unfolds.
              </p>
            </div>
            <div className="card-elevated p-6 text-left">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Summaries</h3>
              <p className="text-subtext text-sm">
                Generate post-call summaries, action items, and follow-up emails in seconds after the call ends.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-subtext">
          <p>© 2025 Echo. Built for discovery call excellence.</p>
        </div>
      </footer>
    </div>
  );
};

export default Marketing;
