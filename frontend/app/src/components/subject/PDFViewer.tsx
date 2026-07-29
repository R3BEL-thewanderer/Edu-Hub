import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Use CDN worker so no local bundling issues
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string | null;
  fileName: string;
  isLoading?: boolean;
  onClose: () => void;
}

export function PDFViewer({ fileUrl, fileName, isLoading, onClose }: PDFViewerProps) {
  // Detect mobile once on mount
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [numPages, setNumPages] = useState<number>(0);
  // Desktop only — current page for pagination
  const [currentPage, setCurrentPage] = useState(1);
  // Mobile starts at 25%, desktop at 100%
  const [scale, setScale] = useState(isMobile ? 0.25 : 1.0);
  const [docLoading, setDocLoading] = useState(true);
  const [docError, setDocError] = useState(false);

  // Sync initial scale when isMobile resolves
  useEffect(() => {
    setScale(isMobile ? 0.25 : 1.0);
  }, [isMobile]);

  // ─── Pinch-to-zoom (mobile only) ───────────────────────────────
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(0.25);

  const getPinchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchStartDistRef.current = getPinchDistance(e.touches);
      pinchStartScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      e.preventDefault();
      const newDist = getPinchDistance(e.touches);
      const ratio = newDist / pinchStartDistRef.current;
      const newScale = Math.min(2.5, Math.max(0.1,
        parseFloat((pinchStartScaleRef.current * ratio).toFixed(2))
      ));
      setScale(newScale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchStartDistRef.current = null;
    }
  };

  // ─── Shared callbacks ───────────────────────────────────────────
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
    setDocLoading(false);
    setDocError(false);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setDocLoading(false);
    setDocError(true);
  }, []);

  // Desktop pagination
  const goToPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNext = () => setCurrentPage((p) => Math.min(numPages, p + 1));

  // Zoom (shared, used by both desktop + mobile buttons; pinch handles mobile gesture)
  const zoomIn  = () => setScale((s) => Math.min(2.5, parseFloat((s + 0.1).toFixed(2))));
  const zoomOut = () => setScale((s) => Math.max(0.1, parseFloat((s - 0.1).toFixed(2))));

  // Error / empty state
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center h-40 mt-8 text-center px-6">
      <div className="w-14 h-14 rounded border-4 border-black bg-rose flex items-center justify-center mb-3 shadow-neo-sm">
        <X className="w-7 h-7 text-black font-black" />
      </div>
      <p className="text-black font-black uppercase tracking-wider">
        Unable to load PDF. Please try again.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onClose}
        className="mt-4 border-2 border-black bg-white text-black font-black uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-sand"
      >
        CLOSE VIEWER
      </Button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-md border-4 border-black shadow-neo-lg overflow-hidden flex flex-col"
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b-4 border-black gap-2 flex-wrap">
        {/* Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded border-2 border-black bg-sage flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <span className="text-black text-xs font-black">PDF</span>
          </div>
          <span className="text-black font-black font-display text-base uppercase tracking-wider truncate max-w-[160px] sm:max-w-xs">
            {fileName}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.1}
            className="text-black border-2 border-transparent hover:border-black hover:bg-sand font-black rounded p-1"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs font-black text-black border-2 border-black bg-sand px-2 py-0.5 rounded min-w-[3.5rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="text-black border-2 border-transparent hover:border-black hover:bg-sand font-black rounded p-1"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-black border-2 border-transparent hover:border-black hover:bg-rose font-black uppercase rounded ml-1"
          >
            <X className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">CLOSE</span>
          </Button>
        </div>
      </div>

      {/* ── PDF Content ─────────────────────────────────────────── */}
      <div
        className="bg-[#f4f4f4] overflow-auto flex flex-col items-center"
        style={{ height: '70vh' }}
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-black animate-spin mb-4" />
            <p className="text-black text-sm font-black uppercase tracking-widest animate-pulse">
              Generating secure link...
            </p>
          </div>
        ) : fileUrl ? (
          <>
            {docLoading && !docError && (
              <div className="flex flex-col items-center justify-center h-40 mt-8">
                <Loader2 className="w-8 h-8 text-black animate-spin mb-4" />
                <p className="text-black text-sm font-black uppercase tracking-widest animate-pulse">
                  Loading document...
                </p>
              </div>
            )}
            {docError && <ErrorState />}

            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
              error={null}
              className="py-4 flex flex-col items-center gap-4"
            >
              {isMobile ? (
                // ── MOBILE: render ALL pages, scroll vertically ──
                Array.from({ length: numPages }, (_, i) => (
                  <Page
                    key={i + 1}
                    pageNumber={i + 1}
                    scale={scale}
                    loading={
                      <div className="flex items-center justify-center w-full py-8">
                        <Loader2 className="w-5 h-5 text-black animate-spin" />
                      </div>
                    }
                    className="shadow-[4px_4px_0px_rgba(0,0,0,1)] border-2 border-black"
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                ))
              ) : (
                // ── DESKTOP: show one page at a time ──
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  loading={
                    <div className="flex items-center justify-center w-full py-12">
                      <Loader2 className="w-6 h-6 text-black animate-spin" />
                    </div>
                  }
                  className="shadow-[4px_4px_0px_rgba(0,0,0,1)] border-2 border-black"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              )}
            </Document>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <ErrorState />
          </div>
        )}
      </div>

      {/* ── Page Navigation Footer (desktop only) ───────────────── */}
      {!isMobile && numPages > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t-4 border-black">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrev}
            disabled={currentPage <= 1}
            className="border-2 border-black text-black font-black uppercase shadow-neo-sm hover:shadow-neo disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Prev
          </Button>

          <span className="text-sm font-black text-black border-2 border-black bg-sand px-3 py-1 rounded shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            {currentPage} / {numPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            disabled={currentPage >= numPages}
            className="border-2 border-black text-black font-black uppercase shadow-neo-sm hover:shadow-neo disabled:opacity-40"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
