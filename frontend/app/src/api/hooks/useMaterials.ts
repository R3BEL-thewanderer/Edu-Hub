import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

export interface Material {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  material_type: string;
  is_active: string;
  average_rating: number;
}

export interface PendingMaterialVersion {
  id: string;
  material_id: string;
  storage_path: string;
  change_summary: string;
  uploaded_by: string;
  approval_status: string;
  created_at: string;
}

export function usePendingMaterials() {
  return useQuery({
    queryKey: ['admin', 'materials', 'pending'],
    queryFn: () => apiClient<PendingMaterialVersion[]>('/api/materials/pending'),
  });
}

export function useApproveMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => 
      apiClient<{success: boolean}>(`/api/materials/${versionId}/approve`, {
        method: 'POST'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'materials'] });
    }
  });
}

export function useRejectMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => 
      apiClient<{success: boolean}>(`/api/materials/${versionId}/reject`, {
        method: 'POST'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'materials'] });
    }
  });
}
