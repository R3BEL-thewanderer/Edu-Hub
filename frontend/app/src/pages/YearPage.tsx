import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Lock, Laptop, Cpu } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InlineAd, DesktopInlineAd } from '@/components/layout/AdSidebar';
import { sem1Subjects, sem2Subjects, itSem1Subjects, itSem2Subjects } from '@/data/mockData';

// Allowed valid academic years
const VALID_YEARS = ['2025-26', '2026-27'];

export function YearPage() {
  const { year } = useParams<{ year: string }>();

  // If year is not valid, redirect to home
  if (!year || !VALID_YEARS.includes(year)) {
    return <Navigate to="/" replace />;
  }

  // Format year for presentation (e.g. 2025-26 -> 2025–26)
  const displayYear = year.replace('-', '–');
  const is2026 = year === '2026-27';

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm" id="year-page-breadcrumb">
          <Link
            to="/"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Home
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-primary font-medium">{displayYear}</span>
        </div>

        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          id="year-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display text-primary mb-2">
            Academic Year {displayYear}
          </h1>
          <p className="text-muted-foreground">
            {is2026 
              ? 'Select your department to access specialized curriculum, semesters, and resources.' 
              : 'Select a semester below to view structured notes, previous year questions, and resources.'}
          </p>
        </div>

        {/* Mobile Ad */}
        <InlineAd size="320x50" className="my-6" />

        {is2026 ? (
          /* Clean Department Selection for 2026-27 */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">

            {/* IT Department Card (Unlocked) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border-4 border-black p-8 shadow-neo hover:shadow-neo-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-sage border-2 border-black flex items-center justify-center text-black shadow-neo-sm">
                      <Laptop className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black font-display text-black">
                        IT Department
                      </h2>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Information Technology · Second Year B.E.
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-sage text-black font-black border-2 border-black px-3 py-1 text-xs">
                    UNLOCKED
                  </Badge>
                </div>

                <p className="text-black font-medium text-sm mb-6 bg-sand/60 border-2 border-black p-4 rounded-xl shadow-neo-sm">
                  Access comprehensive notes, PYQs, and video lectures for Information Technology core semesters (Semester 1 & Semester 2).
                </p>

                <div className="space-y-3 mb-8">
                  <h3 className="text-xs font-black text-black uppercase tracking-wider">
                    Included Subjects
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[...itSem1Subjects, ...itSem2Subjects].map((s) => (
                      <Badge
                        key={s.id}
                        variant="secondary"
                        className="bg-secondary text-secondary-foreground border border-black/40 px-2.5 py-1 text-xs font-bold"
                      >
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Link to="/2026-27/sem1" className="block">
                <Button className="w-full bg-black text-white hover:bg-black/90 font-black flex items-center justify-center gap-2 py-6 rounded-xl text-base shadow-neo-sm hover:shadow-neo transition-all">
                  <span>EXPLORE IT DEPARTMENT</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Computer Engineering Department Card (Locked) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-neutral-100 rounded-2xl border-4 border-black/40 p-8 shadow-sm relative overflow-hidden opacity-85 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-200 border-2 border-black/40 flex items-center justify-center text-muted-foreground">
                      <Cpu className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black font-display text-neutral-700">
                        Computer Engineering
                      </h2>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Computer Dept · Second Year B.E.
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-rose text-black font-black border-2 border-black px-3 py-1 text-xs flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> LOCKED
                  </Badge>
                </div>

                <p className="text-muted-foreground font-medium text-sm mb-6 bg-neutral-200/60 border-2 border-black/20 p-4 rounded-xl">
                  Computer Engineering department folders are currently locked. Notes and resources will be available soon!
                </p>

                <div className="space-y-3 mb-8">
                  <h3 className="text-xs font-black text-neutral-500 uppercase tracking-wider">
                    Included Subjects
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Computer Architecture', 'Algorithms', 'Microprocessors', 'Software Eng.'].map((name) => (
                      <Badge
                        key={name}
                        variant="outline"
                        className="bg-neutral-200/50 text-neutral-500 border border-neutral-300 px-2.5 py-1 text-xs font-medium"
                      >
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Button disabled variant="outline" className="w-full text-neutral-500 font-black flex items-center justify-center gap-2 py-6 rounded-xl text-base border-2 border-black/30">
                <Lock className="w-5 h-5" />
                <span>LOCKED / COMING SOON</span>
              </Button>
            </motion.div>

          </div>
        ) : (
          /* Semesters Cards Grid for 2025-26 */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">

            {/* Semester 1 Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="h-full"
            >
              <div className="flex flex-col justify-between h-full bg-white rounded-2xl border border-border p-8 shadow-sm hover:shadow-md transition-all duration-300 group hover:border-sage">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-sage-light flex items-center justify-center text-sage text-2xl font-bold">
                      1
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold font-display text-primary">Semester 1</h2>
                      <p className="text-xs text-muted-foreground">First Year B.E.</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm mb-6">
                    Contains foundational subjects covering basic engineering fields, computer programming in C, chemistry, and knowledge systems.
                  </p>

                  <div className="space-y-3 mb-8">
                    <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Included Subjects
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {sem1Subjects.map((subject) => (
                        <Badge
                          key={subject.id}
                          variant="secondary"
                          className="bg-secondary text-secondary-foreground border border-border py-1 px-2.5 text-xs font-medium group cursor-pointer"
                        >
                          <span className="mr-1 flex items-center">{typeof subject.icon === 'string' ? subject.icon : <subject.icon className="w-4 h-4 ml-1 mr-1 group-hover:animate-bounce transition-transform" />}</span>
                          {subject.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <Link to={`/${year}/sem1`} className="block">
                  <Button className="w-full bg-primary hover:bg-primary/95 text-white font-semibold flex items-center justify-center gap-2 py-6 rounded-xl group-hover:bg-sage transition-colors duration-300">
                    <span>Explore Semester 1</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Semester 2 Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="h-full"
            >
              <div className="flex flex-col justify-between h-full bg-white rounded-2xl border border-border p-8 shadow-sm hover:shadow-md transition-all duration-300 group hover:border-sky">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-sky-light flex items-center justify-center text-sky text-2xl font-bold">
                      2
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold font-display text-primary">Semester 2</h2>
                      <p className="text-xs text-muted-foreground">First Year B.E.</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm mb-6">
                    Contains core subjects covering basic electrical concepts, graphics & drawing, applied physics, and differential equations.
                  </p>

                  <div className="space-y-3 mb-8">
                    <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Included Subjects
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {sem2Subjects.map((subject) => (
                        <Badge
                          key={subject.id}
                          variant="secondary"
                          className="bg-secondary text-secondary-foreground border border-border py-1 px-2.5 text-xs font-medium group cursor-pointer"
                        >
                          <span className="mr-1 flex items-center">{typeof subject.icon === 'string' ? subject.icon : <subject.icon className="w-4 h-4 ml-1 mr-1 group-hover:animate-bounce transition-transform" />}</span>
                          {subject.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <Link to={`/${year}/sem2`} className="block">
                  <Button className="w-full bg-primary hover:bg-primary/95 text-white font-semibold flex items-center justify-center gap-2 py-6 rounded-xl group-hover:bg-sky transition-colors duration-300">
                    <span>Explore Semester 2</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>

          </div>
        )}

        {/* Desktop Ad */}
        <DesktopInlineAd size="728x90" className="my-8" />
      </div>
    </MainLayout>
  );
}
