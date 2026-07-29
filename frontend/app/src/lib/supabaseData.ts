import { supabase } from '@/lib/supabase';
import type { FileItem, VideoItem } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.104:8000';

/**
 * Fetch files for a subject from Supabase.
 * Returns files grouped by content type.
 * Uses the Supabase anon client (public read via RLS).
 */
export async function fetchSubjectFiles(
  subjectId: string,
  year: string = '2025-26',
  semester: string = 'sem1'
): Promise<{
  notes: FileItem[];
  pdfs: FileItem[];
  pyqs: FileItem[];
  videos: VideoItem[];
}> {
  try {
    // Fetch files (notes, pdfs, pyqs) from the files table
    const { data: filesData, error: filesError } = await supabase
      .from('files')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('year', year)
      .eq('semester', semester)
      .order('uploaded_at', { ascending: false });

    if (filesError) throw filesError;

    // Fetch videos
    const { data: videosData, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('year', year)
      .eq('semester', semester)
      .order('uploaded_at', { ascending: false });

    if (videosError) throw videosError;

    // Map DB rows to our FileItem type
    const files = (filesData || []).map((row: any): FileItem => ({
      id: row.id,
      subjectId: row.subject_id,
      year: row.year,
      semester: row.semester,
      contentType: row.content_type,
      title: row.title,
      storagePath: row.storage_path,
      sizeBytes: row.size_bytes || 0,
      mimeType: row.mime_type || 'application/pdf',
      examYear: row.exam_year,
      uploadedAt: row.uploaded_at,
      downloads: row.downloads || 0,
      views: row.views || 0,
    }));

    const videos = (videosData || []).map((row: any): VideoItem => ({
      id: row.id,
      subjectId: row.subject_id,
      year: row.year,
      semester: row.semester,
      title: row.title,
      videoType: row.video_type,
      youtubeUrl: row.youtube_url,
      storagePath: row.storage_path,
      duration: row.duration || '',
      thumbnailUrl: row.thumbnail_url,
      uploadedAt: row.uploaded_at,
      views: row.views || 0,
    }));

    return {
      notes: files.filter(f => f.contentType === 'notes'),
      pdfs: files.filter(f => f.contentType === 'pdfs'),
      pyqs: files.filter(f => f.contentType === 'pyqs'),
      videos,
    };
  } catch (error) {
    console.error('Error fetching subject files:', error);
    return { notes: [], pdfs: [], pyqs: [], videos: [] };
  }
}

/**
 * Get a signed URL for viewing a PDF inline (no download).
 * Routes through the BACKEND API because only the service role key
 * can create signed URLs on a private bucket.
 * Signed URLs expire after 1 hour.
 */
export async function getSignedViewUrl(storagePath: string): Promise<string | null> {
  try {
    // Get the current user's access token for auth
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${API_URL}/api/files/signed-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ filePath: storagePath }),
    });

    if (!response.ok) {
      console.error('Signed URL request failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.signedUrl || null;
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
}

/**
 * Fetch platform-wide stats for the homepage marquee.
 */
export async function fetchPlatformStats(): Promise<{
  totalFiles: number;
  totalVideos: number;
}> {
  try {
    const { count: filesCount } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true });
      
    const { count: videosCount } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    return {
      totalFiles: filesCount || 0,
      totalVideos: videosCount || 0,
    };
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return { totalFiles: 0, totalVideos: 0 };
  }
}
