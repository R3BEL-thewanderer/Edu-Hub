import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SubjectCard } from '@/components/home/SubjectCard';
import { InlineAd, DesktopInlineAd } from '@/components/layout/AdSidebar';
import { sem1Subjects, sem2Subjects, itSem1Subjects, itSem2Subjects } from '@/data/mockData';

export function SemesterPage() {
  const { year, semester } = useParams<{ year: string; semester: string }>();
  
  const subjects = year === '2026-27'
    ? (semester === 'sem2' ? itSem2Subjects : itSem1Subjects)
    : (semester === 'sem2' ? sem2Subjects : sem1Subjects);
  
  const semesterLabel = semester === 'sem2' ? 'Semester 2' : 'Semester 1';

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link 
            to="/" 
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Home
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-primary">{year}</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-primary font-medium">{semesterLabel}</span>
        </div>

        {/* Back Button */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display text-primary mb-2">
            {year} · {semesterLabel}
          </h1>
          <p className="text-muted-foreground">
            Select a subject to access notes, PDFs, PYQs and videos
          </p>
        </div>

        {/* Mobile Ad */}
        <InlineAd size="320x50" className="my-6" />

        {/* Subjects Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {subjects.map((subject, index) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <SubjectCard subject={subject} />
            </motion.div>
          ))}
        </motion.div>

        {/* Desktop Ad */}
        <DesktopInlineAd size="728x90" className="my-8" />
      </div>
    </MainLayout>
  );
}
