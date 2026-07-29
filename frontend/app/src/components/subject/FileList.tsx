import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Eye,
  Calendar,
  HardDrive,
  FileImage,
  Lock,
  Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FileItem } from '@/types';
import { formatFileSize, formatDate } from '@/data/mockData';
import { PDFViewer } from './PDFViewer';
import { getSignedViewUrl } from '@/lib/supabaseData';

interface FileListProps {
  files: FileItem[];
  contentType: 'notes' | 'pdfs' | 'pyqs';
  isLoggedIn: boolean;
}

export function FileList({ files, contentType, isLoggedIn }: FileListProps) {
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null);
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <FileImage className="w-6 h-6 text-black group-hover:animate-bounce transition-transform" />;
    }
    return <FileText className="w-6 h-6 text-black group-hover:animate-bounce transition-transform" />;
  };

  const getEmptyStateMessage = () => {
    switch (contentType) {
      case 'notes':
        return 'No notes uploaded yet — check back soon!';
      case 'pdfs':
        return 'No PDFs uploaded yet — check back soon!';
      case 'pyqs':
        return 'PYQ papers will be added before exams — stay tuned!';
      default:
        return 'No content here yet — check back soon!';
    }
  };

  const handleViewFile = async (file: FileItem) => {
    setViewingFile(file);
    setIsLoadingUrl(true);

    // Get a signed URL from Supabase for secure viewing
    const url = await getSignedViewUrl(file.storagePath);
    if (url) {
      setViewingUrl(url);
    }
    setIsLoadingUrl(false);
  };

  const handleCloseViewer = () => {
    setViewingFile(null);
    setViewingUrl(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-12 border-4 border-black border-dashed rounded-xl bg-white shadow-neo-sm mt-4 group hover:bg-sage/10 transition-colors">
        <div className="w-16 h-16 rounded-md border-2 border-black bg-sand flex items-center justify-center mx-auto mb-4 shadow-neo-sm group-hover:bg-sage transition-colors">
          <Inbox className="w-8 h-8 text-black group-hover:animate-bounce transition-transform" />
        </div>
        <p className="text-black font-bold uppercase tracking-wider">{getEmptyStateMessage()}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* File List */}
      <div className="space-y-3">
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-md border-2 border-black p-4 hover:-translate-x-1 hover:-translate-y-1 shadow-neo-sm hover:shadow-neo transition-all group cursor-pointer"
          >
            <div className="flex items-start gap-4">
              {/* File Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded bg-sage border-2 border-black flex items-center justify-center shadow-neo-sm">
                {getFileIcon(file.mimeType)}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-black font-black text-lg truncate">
                  {file.title}
                </h4>

                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-black font-bold">
                  <span className="flex items-center gap-1 border-2 border-black px-2 py-0.5 bg-white rounded shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <HardDrive className="w-3 h-3" />
                    {formatFileSize(file.sizeBytes)}
                  </span>
                  <span className="flex items-center gap-1 border-2 border-black px-2 py-0.5 bg-white rounded shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <Calendar className="w-3 h-3" />
                    {formatDate(file.uploadedAt)}
                  </span>
                  {file.examYear && (
                    <Badge variant="secondary" className="bg-sand text-black border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                      {file.examYear}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions — View only, NO download */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isLoggedIn ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewFile(file)}
                    className="border-2 border-black text-black hover:text-black hover:bg-sand shadow-neo-sm hover:shadow-neo font-black uppercase"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                ) : (
                  <Badge variant="secondary" className="bg-white text-black border-2 border-black font-black uppercase shadow-neo-sm">
                    <Lock className="w-3 h-3 mr-1" /> LOGIN TO ACCESS
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {viewingFile && (
          <motion.div
            ref={viewerRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onAnimationComplete={() => {
              if (viewingFile && viewerRef.current) {
                const yOffset = -100; // 100px top offset to preserve top navbar & comfortable margin
                const elementTop = viewerRef.current.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({ top: Math.max(0, elementTop + yOffset), behavior: 'smooth' });
              }
            }}
          >
            <PDFViewer
              fileUrl={viewingUrl}
              fileName={viewingFile.title}
              isLoading={isLoadingUrl}
              onClose={handleCloseViewer}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
