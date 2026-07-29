import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight, FileText, BookOpen } from 'lucide-react';
import { sem1Subjects, sem2Subjects, getFilesBySubject } from '@/data/mockData';
import type { FileItem, Subject } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ResourceBrowserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (files: FileItem[]) => void;
    existingSelections: string[]; // array of IDs to show what's already selected
    initialSubjectId?: string;
}

type Step = 'YEAR' | 'SEMESTER' | 'SUBJECT' | 'RESOURCE';
type FilterType = 'all' | 'notes' | 'pdfs';

export function ResourceBrowserModal({ isOpen, onClose, onSelect, existingSelections, initialSubjectId }: ResourceBrowserModalProps) {
    const [step, setStep] = useState<Step>('YEAR');
    const [selectedYear, setSelectedYear] = useState('2025-26');
    const [selectedSemester, setSelectedSemester] = useState<'sem1' | 'sem2' | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');

    // Local selection state before confirming
    const [localSelections, setLocalSelections] = useState<FileItem[]>([]);

    // Reset state when opening/closing
    React.useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setFilterType('all');
            setLocalSelections([]);

            if (initialSubjectId) {
                const allSubs = [...sem1Subjects, ...sem2Subjects];
                const foundSub = allSubs.find(
                    s => s.id === initialSubjectId || s.name.toLowerCase() === initialSubjectId.toLowerCase()
                );
                if (foundSub) {
                    setSelectedYear(foundSub.year || '2025-26');
                    setSelectedSemester(foundSub.semester as 'sem1' | 'sem2');
                    setSelectedSubject(foundSub);
                    setStep('RESOURCE');
                } else {
                    setStep('YEAR');
                    setSelectedYear('2025-26');
                    setSelectedSemester(null);
                    setSelectedSubject(null);
                }
            } else {
                setStep('YEAR');
                setSelectedYear('2025-26');
                setSelectedSemester(null);
                setSelectedSubject(null);
            }
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, initialSubjectId]);

    const handleYearSelect = () => setStep('SEMESTER');

    const handleSemesterSelect = (sem: 'sem1' | 'sem2') => {
        setSelectedSemester(sem);
        setStep('SUBJECT');
    };

    const handleSubjectSelect = (sub: Subject) => {
        setSelectedSubject(sub);
        setStep('RESOURCE');
    };

    const toggleSelection = (file: FileItem) => {
        setLocalSelections(prev => {
            const exists = prev.find(p => p.id === file.id) || existingSelections.includes(file.id);
            if (exists) {
                return prev.filter(p => p.id !== file.id);
            }
            return [...prev, file];
        });
    };

    const handleConfirm = () => {
        onSelect(localSelections);
        onClose();
    };

    const subjects = useMemo(() => {
        let list = selectedSemester === 'sem1' ? sem1Subjects : (selectedSemester === 'sem2' ? sem2Subjects : []);
        if (searchQuery) list = list.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return list;
    }, [selectedSemester, searchQuery]);

    const resources = useMemo(() => {
        if (!selectedSubject) return [];
        const notes = getFilesBySubject(selectedSubject.id, 'notes');
        const pdfs = getFilesBySubject(selectedSubject.id, 'pdfs');
        let all = [...notes, ...pdfs];

        if (filterType === 'notes') all = notes;
        if (filterType === 'pdfs') all = pdfs;
        if (searchQuery) all = all.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));

        return all;
    }, [selectedSubject, filterType, searchQuery]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white border-4 border-black shadow-neo-lg rounded-xl flex flex-col max-h-[85vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b-4 border-black bg-sand">
                        <div>
                            <h2 className="text-2xl font-black font-display uppercase tracking-tight text-black">
                                EduHub Resources
                            </h2>
                            <div className="flex items-center gap-2 text-sm font-bold text-black/70 mt-1">
                                <button onClick={() => setStep('YEAR')} className="hover:text-black hover:underline cursor-pointer">Start</button>
                                {step !== 'YEAR' && <>
                                    <ChevronRight className="w-3 h-3" />
                                    <button onClick={() => setStep('SEMESTER')} className="hover:text-black hover:underline cursor-pointer">
                                        {selectedYear}
                                    </button>
                                </>}
                                {(step === 'SUBJECT' || step === 'RESOURCE') && selectedSemester && <>
                                    <ChevronRight className="w-3 h-3" />
                                    <button onClick={() => setStep('SUBJECT')} className="hover:text-black hover:underline cursor-pointer">
                                        {selectedSemester === 'sem1' ? 'Sem 1' : 'Sem 2'}
                                    </button>
                                </>}
                                {step === 'RESOURCE' && selectedSubject && <>
                                    <ChevronRight className="w-3 h-3" />
                                    <span className="text-black">{selectedSubject.name}</span>
                                </>}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 border-2 border-black rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] transition-all bg-white"
                        >
                            <X className="w-5 h-5 text-black font-black" />
                        </button>
                    </div>

                    {/* Search Bar - Only for Subjects & Resources */}
                    {(step === 'SUBJECT' || step === 'RESOURCE') && (
                        <div className="p-4 border-b-4 border-black bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/50" />
                                <input
                                    type="text"
                                    placeholder={step === 'SUBJECT' ? "Search subjects..." : "Search PDFs and notes..."}
                                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-black rounded-lg text-black font-bold outline-none focus:shadow-neo-sm transition-shadow"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            {step === 'RESOURCE' && (
                                <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
                                    <Badge
                                        onClick={() => setFilterType('all')}
                                        className={`cursor-pointer border-2 border-black transition-colors ${filterType === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-black hover:bg-gray-200'}`}
                                    >
                                        All
                                    </Badge>
                                    <Badge
                                        onClick={() => setFilterType('notes')}
                                        className={`cursor-pointer border-2 border-black transition-colors ${filterType === 'notes' ? 'bg-rose text-black' : 'bg-gray-100 text-black hover:bg-gray-200'}`}
                                    >
                                        <BookOpen className="w-3 h-3 mr-1" /> Notes
                                    </Badge>
                                    <Badge
                                        onClick={() => setFilterType('pdfs')}
                                        className={`cursor-pointer border-2 border-black transition-colors ${filterType === 'pdfs' ? 'bg-sky text-black' : 'bg-gray-100 text-black hover:bg-gray-200'}`}
                                    >
                                        <FileText className="w-3 h-3 mr-1" /> PDFs
                                    </Badge>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f4f4f4]">
                        {step === 'YEAR' && (
                            <div className="grid gap-3 max-w-sm mx-auto">
                                <h3 className="text-black font-bold mb-2">Select Academic Year</h3>
                                <button
                                    onClick={handleYearSelect}
                                    className="w-full flex items-center justify-between p-4 bg-white border-2 border-black rounded-xl shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 transition-all group"
                                >
                                    <span className="font-black text-lg text-black">2025-26</span>
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <div className="w-full flex items-center justify-between p-4 bg-gray-100 border-2 border-gray-300 text-gray-400 rounded-xl cursor-not-allowed">
                                    <span className="font-bold text-lg">2026-27</span>
                                    <span className="text-sm">🔒</span>
                                </div>
                            </div>
                        )}

                        {step === 'SEMESTER' && (
                            <div className="grid sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleSemesterSelect('sem1')}
                                    className="flex flex-col items-center justify-center p-8 bg-sky border-2 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] transition-all"
                                >
                                    <span className="text-4xl mb-4 font-display font-black text-black">S1</span>
                                    <span className="font-black text-xl text-black uppercase">Semester 1</span>
                                </button>
                                <button
                                    onClick={() => handleSemesterSelect('sem2')}
                                    className="flex flex-col items-center justify-center p-8 bg-sage border-2 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] transition-all"
                                >
                                    <span className="text-4xl mb-4 font-display font-black text-black">S2</span>
                                    <span className="font-black text-xl text-black uppercase">Semester 2</span>
                                </button>
                            </div>
                        )}

                        {step === 'SUBJECT' && (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {subjects.length === 0 ? (
                                    <div className="col-span-full py-12 text-center text-gray-500 font-bold border-2 border-dashed border-gray-300 rounded-xl">
                                        No subjects found.
                                    </div>
                                ) : (
                                    subjects.map(sub => (
                                        <button
                                            key={sub.id}
                                            onClick={() => handleSubjectSelect(sub)}
                                            className="flex flex-col items-start p-4 bg-white border-2 border-black rounded-lg shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all text-left group"
                                        >
                                            <div className="w-10 h-10 bg-sand border-2 border-black rounded flex items-center justify-center mb-3">
                                                {typeof sub.icon === 'string' ? sub.icon : <sub.icon className="w-5 h-5 text-black" />}
                                            </div>
                                            <span className="font-black text-black group-hover:text-primary mb-1 uppercase tracking-tight">{sub.name}</span>
                                            <span className="text-xs font-bold text-gray-600 line-clamp-1">{sub.fullName}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}

                        {step === 'RESOURCE' && (
                            <div className="space-y-3">
                                {resources.length === 0 ? (
                                    <div className="py-12 text-center border-2 border-dashed border-gray-400 bg-white rounded-xl">
                                        <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                        <span className="text-gray-500 font-bold uppercase block">No resources found</span>
                                    </div>
                                ) : (
                                    resources.map(res => {
                                        const isSelectedGlobally = existingSelections.includes(res.id);
                                        const isSelectedLocally = localSelections.some(l => l.id === res.id);
                                        const isSelected = isSelectedGlobally || isSelectedLocally;
                                        return (
                                            <div
                                                key={res.id}
                                                className={`flex items-center gap-4 p-4 border-2 border-black rounded-xl transition-all cursor-pointer ${isSelected ? 'bg-sage border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'bg-white hover:shadow-neo-sm'
                                                    } ${isSelectedGlobally ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                onClick={() => !isSelectedGlobally && toggleSelection(res)}
                                            >
                                                <div className="w-5 h-5 border-2 border-black rounded bg-white flex items-center justify-center shrink-0">
                                                    {isSelected && <div className="w-3 h-3 bg-black rounded-sm" />}
                                                </div>
                                                <div className="w-10 h-10 bg-sand border-2 border-black rounded flex items-center justify-center shrink-0">
                                                    {res.contentType === 'pdfs' ? <FileText className="w-5 h-5 text-black" /> : <BookOpen className="w-5 h-5 text-black" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`font-black truncate ${isSelected ? 'text-black' : 'text-gray-800'}`}>
                                                        {res.title}
                                                    </h4>
                                                    <span className={`text-xs font-bold uppercase ${isSelected ? 'text-black/70' : 'text-gray-500'}`}>
                                                        {res.contentType === 'pdfs' ? 'PDF Note' : 'Written Note'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 sm:p-6 border-t-4 border-black bg-white flex items-center justify-between">
                        <div className="text-sm font-bold text-gray-600">
                            {localSelections.length > 0 ? (
                                <span><span className="text-black font-black bg-rose px-2 py-0.5 rounded border border-black">{localSelections.length}</span> selected</span>
                            ) : 'No new selection'}
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={onClose} variant="outline" className="border-2 border-black text-black font-bold uppercase">Cancel</Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={localSelections.length === 0}
                                className="bg-black text-white font-black hover:bg-gray-800 disabled:opacity-50 uppercase"
                            >
                                Add context
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
