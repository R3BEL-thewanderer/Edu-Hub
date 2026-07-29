import { motion } from 'framer-motion';
import { Lock, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Year {
  label: string;
  subtitle: string;
  active: boolean;
  locked: boolean;
  badge?: string;
  path?: string;
}

const years: Year[] = [
  { label: '2025 – 26', subtitle: 'First Year B.E.', active: true, locked: false, badge: 'ACTIVE', path: '2025-26' },
  { label: '2026 – 27', subtitle: 'Second Year B.E.', active: false, locked: false, badge: 'UNDER DEVELOPMENT', path: '2026-27' },
  { label: '2027 – 28', subtitle: 'Coming Later', active: false, locked: true, path: '2027-28' },
];

export function YearSelector() {
  const navigate = useNavigate();

  return (
    <section className="py-10 section reveal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          Select Academic Year
        </h2>
        
        <div className="flex flex-wrap gap-4">
          {years.map((year, index) => (
            <motion.div
              key={year.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative flex items-center gap-4 px-5 py-4 rounded-md border-2 border-black transition-all
                ${year.active 
                  ? 'bg-sage shadow-neo transform -translate-x-1 -translate-y-1' 
                  : year.badge === 'UNDER DEVELOPMENT'
                  ? 'bg-amber-100 shadow-neo-sm border-black hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo'
                  : 'bg-white shadow-neo-sm opacity-80'
                }
                ${year.locked ? 'cursor-not-allowed bg-muted' : 'cursor-pointer'}
              `}
              onClick={() => {
                if (!year.locked && year.path) {
                  navigate(`/${year.path}`);
                }
              }}
            >
              <div className={`
                w-10 h-10 rounded flex items-center justify-center border-2 border-black
                ${year.active ? 'bg-white' : 'bg-secondary'}
              `}>
                <Calendar className={`w-5 h-5 ${year.active ? 'text-black' : 'text-muted-foreground'}`} />
              </div>
              
              <div>
                <h3 className={`font-black font-display text-lg ${year.active ? 'text-black' : 'text-primary'}`}>
                  {year.label}
                </h3>
                <p className={`text-sm font-bold ${year.active ? 'text-black/80' : 'text-muted-foreground'}`}>{year.subtitle}</p>
              </div>
              
              {year.locked && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded backdrop-blur-[1px]">
                  <div className="bg-black text-white p-2 border-2 border-black rounded-md rotate-3 shadow-neo-sm">
                    <Lock className="w-5 h-5" />
                  </div>
                </div>
              )}
              
              {year.badge === 'ACTIVE' && (
                <div className="absolute -top-3 -right-3 px-2 py-1 bg-white border-2 border-black text-black text-xs font-black rounded shadow-neo-sm transform rotate-6">
                  ACTIVE
                </div>
              )}

              {year.badge === 'UNDER DEVELOPMENT' && (
                <div className="absolute -top-3 -right-3 px-2 py-0.5 bg-amber-300 border-2 border-black text-black text-[10px] font-black rounded shadow-neo-sm transform -rotate-3 uppercase tracking-wider">
                  UNDER DEVELOPMENT
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
