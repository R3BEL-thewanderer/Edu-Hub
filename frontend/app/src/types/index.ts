import React from 'react';

// User Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  college: string;
  branch?: string;
  division?: string;
  rollNumber?: string;
  studentId?: string;
  admissionBatch?: number;
  departmentCode?: string;
  phone?: string;
  bio?: string;
  studyAnalytics?: Record<string, number>;
  roles: string[];
  ai_tutor_enabled: boolean;
  subscription: {
    isPaid: boolean;
    plan: 'monthly' | 'semester' | null;
    expiresAt: Date | null;
  };
}

// Subject Types
export interface Subject {
  id: string;
  year: string;
  semester: string;
  name: string;
  fullName: string;
  icon: React.ElementType | string;
  imagePath?: string;
  description: string;
  isLocked: boolean;
  displayOrder: number;
  notesCount: number;
  pdfsCount: number;
  pyqsCount: number;
  videosCount: number;
  totalViews: number;
}

// File Types
export interface FileItem {
  id: string;
  subjectId: string;
  year: string;
  semester: string;
  contentType: 'notes' | 'pdfs' | 'pyqs';
  title: string;
  storagePath: string;
  sizeBytes: number;
  mimeType: string;
  examYear?: string;
  uploadedAt: string;
  downloads: number;
  views: number;
}

// Video Types
export interface VideoItem {
  id: string;
  subjectId: string;
  year: string;
  semester: string;
  title: string;
  videoType: 'youtube' | 'hosted';
  youtubeUrl?: string;
  storagePath?: string;
  duration: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  views: number;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  sources?: string[];
  createdAt: string;
}

export interface ChatSession {
  id: string;
  subjectId: string;
  year: string;
  semester: string;
  createdAt: string;
  lastMessageAt: string;
}

// Payment Types
export interface Payment {
  id: string;
  plan: 'monthly' | 'semester';
  amount: number;
  status: 'created' | 'paid' | 'failed';
  createdAt: string;
  paidAt?: string;
}

// Content Tab Type
export type ContentTab = 'notes' | 'pdfs' | 'pyqs' | 'videos' | 'flashcards';

// Ad Size Types
export type AdSize = '160x600' | '320x50' | '320x100' | '320x250' | '728x90';
