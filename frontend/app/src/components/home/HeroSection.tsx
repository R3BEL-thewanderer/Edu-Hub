import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroCanvas } from './HeroCanvas';
import { useAuthStore } from '@/store/authStore';

const typewriterWords = [
  'First Year B.E.',
  'Your Exams',
  'Engineering Core',
];

export function HeroSection() {
  const { isAuthenticated } = useAuthStore();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = typewriterWords[currentWordIndex];
    
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentText.length < word.length) {
            setCurrentText(word.slice(0, currentText.length + 1));
          } else {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          if (currentText.length > 0) {
            setCurrentText(currentText.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentWordIndex((prev) => (prev + 1) % typewriterWords.length);
          }
        }
      },
      isDeleting ? 50 : 100
    );

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex]);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-background">
      {/* Three.js Background Canvas */}
      <HeroCanvas />
      
      {/* Decorative Brutalist Shapes */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-sage border-4 border-black rounded-full -z-10 animate-[spin_10s_linear_infinite]" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-rose border-4 border-black -z-10 rotate-12" />
      <div className="absolute top-40 right-1/4 w-24 h-24 bg-sand border-4 border-black rounded-tl-3xl rounded-br-3xl -z-10 -rotate-12" />
      
      <div className="relative w-full max-w-7xl mx-auto px-4 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
        {/* Content Side */}
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sand border-2 border-black shadow-neo-sm mb-8 transform -rotate-2"
          >
            <span className="text-xs font-black uppercase tracking-widest text-black">
              ★ EduHub Edition
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black font-display text-black leading-[1.05] tracking-tight mb-6 uppercase"
          >
            Study Smarter,
            <br />
            <span className="text-sage inline-block bg-black px-2 mt-2 -ml-2 skew-x-[-10deg]">Ace</span>
            <div className="h-[2.5em] md:h-[2.2em] w-full block mt-2 pr-4">
              <span className="relative inline-block text-black z-10">
                {currentText}
                <span className="animate-pulse font-light text-rose ml-1">|</span>
              </span>
            </div>
          </motion.h1>

          {/* Bold Catchphrase */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-xl sm:text-2xl font-black text-black mb-4 max-w-xl border-l-4 border-rose pl-4"
          >
            NOTES BY STUDENTS, FOR STUDENTS. NO FACULTY. NO FLUFF.
          </motion.p>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-black font-bold mb-10 max-w-xl leading-relaxed bg-white border-2 border-black p-4 shadow-neo-sm"
          >
            Data-driven curation of notes, precise PYQs, and high-yield video lectures — everything you need to turn study hours into academic mastery.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-start gap-4 mb-2"
          >
            <Button 
              size="lg" 
              className="bg-black text-white hover:bg-black/90 font-black px-8 h-14 text-base"
              onClick={() => document.getElementById('subjects')?.scrollIntoView({ behavior: 'smooth' })}
            >
              EXPLORE SUBJECTS
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
            {!isAuthenticated && (
              <Link to="/auth/login">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-sand text-black border-2 border-black hover:bg-sand/80 h-14 px-8 font-black text-base"
                >
                  SIGN IN
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Hero Canvas and content */}
    </section>
  );
}
