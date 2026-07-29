import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Check, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FlashcardList() {
  const [isFlipped, setIsFlipped] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-2xl font-black text-black uppercase tracking-wider">Subject Flashcards</h3>
      </div>

      <div className="text-center text-sm font-bold text-black uppercase tracking-wider mb-2">
        Press 'Space' to flip, ← / → to navigate
      </div>

      {/* Flashcard Container */}
      <div 
        className="relative w-full h-[320px] perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <AnimatePresence initial={false} mode="wait">
          {!isFlipped ? (
            // Front side (Dark)
            <motion.div
              key="front"
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full bg-black text-white rounded-xl p-8 flex flex-col items-center justify-center shadow-neo-lg border-4 border-black"
            >
              <div className="absolute top-6 left-6 text-white/50 font-black text-sm">
                1/1
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-center leading-relaxed max-w-lg mt-4">
                The Latin root word 'communicare' means to _________.
              </h2>
              
              <div className="absolute bottom-6 text-white/50 text-sm font-black uppercase hover:text-white transition-colors">
                See answer
              </div>
            </motion.div>
          ) : (
            // Back side (Light)
            <motion.div
              key="back"
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full bg-sand text-black rounded-xl p-8 flex flex-col items-center justify-center shadow-neo-lg border-4 border-black"
            >
              <h2 className="text-3xl sm:text-4xl font-black text-center max-w-lg text-black uppercase">
                Impart or make common
              </h2>
              
              <div className="absolute bottom-6 left-6">
                <Button variant="outline" size="sm" className="rounded border-2 border-black bg-white text-black font-black uppercase hover:bg-sage shadow-neo-sm gap-2" onClick={(e) => e.stopPropagation()}>
                  <Sparkles className="w-4 h-4 text-black" />
                  EXPLAIN
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded w-12 h-12 border-2 border-black text-black opacity-50 cursor-not-allowed shadow-neo-sm" disabled>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded px-5 h-12 border-2 border-black bg-rose text-black hover:bg-rose hover:text-black gap-2 shadow-neo-sm hover:shadow-neo hover:-translate-y-1">
              <X className="w-5 h-5 font-black" />
              <span className="font-black text-lg">0</span>
            </Button>
            <Button variant="outline" className="rounded px-5 h-12 border-2 border-black bg-sage text-black hover:bg-sage hover:text-black gap-2 shadow-neo-sm hover:shadow-neo hover:-translate-y-1">
              <span className="font-black text-lg">0</span>
              <Check className="w-5 h-5 font-black" />
            </Button>
          </div>

          <Button variant="outline" size="icon" className="rounded w-12 h-12 border-2 border-black text-black hover:bg-sand transition-colors shadow-neo-sm hover:shadow-neo hover:-translate-y-1">
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-black font-bold uppercase tracking-wider hover:text-black hover:bg-sand gap-2 rounded border-2 border-transparent hover:border-black">
            <ThumbsUp className="w-4 h-4" />
            GOOD CONTENT
          </Button>
          <Button variant="ghost" size="sm" className="text-black font-bold uppercase tracking-wider hover:text-black hover:bg-rose gap-2 rounded border-2 border-transparent hover:border-black">
            <ThumbsDown className="w-4 h-4" />
            BAD CONTENT
          </Button>
        </div>
      </div>
    </div>
  );
}
