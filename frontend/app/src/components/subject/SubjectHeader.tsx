import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, BookOpen, ClipboardList, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Subject } from '@/types';

interface SubjectHeaderProps {
  subject: Subject;
}

export function SubjectHeader({ subject }: SubjectHeaderProps) {
  const studyTimeHours = Math.round(
    (subject.videosCount || 0) * 1.5 + 
    (subject.pdfsCount || 0) * 2 + 
    (subject.notesCount || 0) * 0.5 + 
    (subject.pyqsCount || 0) * 1
  );
  
  const stats = [
    { label: 'Units', value: subject.notesCount, icon: FileText },
    { label: 'PDF Notes', value: subject.pdfsCount, icon: BookOpen },
    { label: 'Video Lectures', value: subject.videosCount, icon: Play },
    { label: 'Study Time', value: studyTimeHours > 0 ? `~${studyTimeHours} hrs` : '0 hrs', icon: ClipboardList },
  ];

  return (
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
        <Link
          to={`/${subject.year}`}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          {subject.year.replace('-', '–')}
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <Link
          to={`/${subject.year}/${subject.semester}`}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          {subject.semester === 'sem2' ? 'Semester 2' : 'Semester 1'}
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-black font-black uppercase tracking-tight">{subject.name}</span>
      </div>

      {/* Back Button */}
      <Link
        to={`/${subject.year}/${subject.semester}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Subjects</span>
      </Link>

      {/* Main Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-4 border-black p-6 shadow-neo-lg"
      >
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Icon */}
          <div className="w-16 h-16 bg-sand border-2 border-black flex items-center justify-center text-4xl flex-shrink-0 shadow-neo-sm group hover:bg-sage transition-all">
            {typeof subject.icon === 'string' ? subject.icon : <subject.icon className="w-8 h-8 text-black group-hover:animate-bounce transition-transform" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-3xl sm:text-4xl font-black font-display text-black uppercase tracking-tight">
                {subject.name}
              </h1>
              <Badge className="bg-sage text-black border-2 border-black shadow-neo-sm">
                FREE
              </Badge>
            </div>

            <p className="text-lg text-black font-bold mb-1">
              {subject.fullName}
            </p>

            <p className="text-sm text-black/70 font-bold uppercase tracking-wider">
              {subject.semester === 'sem2' ? 'Semester 2' : 'Semester 1'} · Academic Year {subject.year.replace('-', '–')} · B.E. First Year
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="secondary" className="bg-white text-black border-2 border-black shadow-neo-sm">
                <FileText className="w-3 h-3 mr-1" />
                NOTES
              </Badge>
              <Badge variant="secondary" className="bg-white text-black border-2 border-black shadow-neo-sm">
                <BookOpen className="w-3 h-3 mr-1" />
                PDFS
              </Badge>
              <Badge variant="secondary" className="bg-white text-black border-2 border-black shadow-neo-sm">
                <ClipboardList className="w-3 h-3 mr-1" />
                PYQ
              </Badge>
              <Badge variant="secondary" className="bg-white text-black border-2 border-black shadow-neo-sm">
                <Play className="w-3 h-3 mr-1" />
                VIDEOS
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t-4 border-black">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon className="w-5 h-5 text-rose" />
                  <span className="text-3xl font-black font-display text-black">{stat.value}</span>
                </div>
                <p className="text-xs font-bold text-black uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
