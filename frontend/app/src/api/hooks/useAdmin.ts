import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

// -----------------
// Dashboard
// -----------------
export interface DashboardStats {
  status: string;
  totalUsers: number;
  totalFiles: number;
  activeStaff: number;
  activeTraffic?: number;
  timestamp: string;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => apiClient<DashboardStats>('/api/admin/dashboard'),
  });
}

// -----------------
// System Health
// -----------------
export interface SystemHealth {
  database: string;
  storage: string;
  api: string;
  ai_service: string;
  recent_errors?: { timestamp: string, level: string, message: string }[];
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['admin', 'health'],
    queryFn: () => apiClient<SystemHealth>('/api/admin/health'),
    refetchInterval: 30000, // auto refetch every 30s
  });
}

// -----------------
// Settings
// -----------------
export interface SystemSettings {
  platformName: string;
  maintenanceMode: boolean;
  registrationOpen: boolean;
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => apiClient<SystemSettings>('/api/admin/settings'),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SystemSettings>) => 
      apiClient<{success: boolean}>('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    }
  });
}

// -----------------
// Users Connection
// -----------------
export interface UserProfileProfile {
  id: string;
  email: string;
  display_name: string;
  full_name?: string;
  department: string | null;
  admission_batch: string | null;
  is_active: boolean;
  ai_tutor_enabled: boolean;
  roles: string[];
}

export function useUsers(limit: number = 50, offset: number = 0) {
  return useQuery({
    queryKey: ['admin', 'users', limit, offset],
    queryFn: () => apiClient<{data: UserProfileProfile[], total: number}>(`/api/admin/users?limit=${limit}&offset=${offset}`),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string, payload: any }) => 
      apiClient<{success: boolean}>(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });
}

// -----------------
// Announcements
// -----------------
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
  is_active: boolean;
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: () => apiClient<{data: Announcement[]}>('/api/admin/announcements'),
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient<{success: boolean}>(`/api/admin/announcements/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Announcement>) => apiClient<{success: boolean}>('/api/admin/announcements', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  });
}

// -----------------
// Permissions & Roles
// -----------------
export function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => 
      apiClient<{success: boolean}>(`/api/admin/users/${userId}/roles`, { method: 'POST', body: JSON.stringify({ role }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useRevokeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => 
      apiClient<{success: boolean}>(`/api/admin/users/${userId}/roles/${role}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}
export interface PermissionNode {
  id: string;
  role: string;
  description: string;
  allowed_features: string[];
}

export function usePermissions() {
  return useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: async () => {
      // Graceful offline mode / mocked backend response
      return Promise.resolve<{data: PermissionNode[]}>({
        data: [
          { id: '1', role: 'Super Admin', description: 'Total control over system variables.', allowed_features: ['*'] },
          { id: '2', role: 'Admin', description: 'Can manage users and content, but no global config.', allowed_features: ['manage_users', 'manage_content'] },
          { id: '3', role: 'Content Manager', description: 'Restricted to material approval and uploads.', allowed_features: ['manage_content'] },
        ]
      });
    }
  });
}
// -----------------
// Mock Tests (Mocked Endpoint for Future Connection)
// -----------------
export interface MockTestNode {
  id: string;
  title: string;
  questions_count: number;
  status: string;
  participants_count: number;
}

export function useMockTests() {
  return useQuery({
    queryKey: ['admin', 'mock-tests'],
    queryFn: () => apiClient<{data: MockTestNode[]}>('/api/assessment/admin/tests')
  });
}
