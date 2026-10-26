import api from '@/lib/axios';
import type { HomeSection } from '@/utils/homeSections';

export interface HomeEditorItem {
  key: string; movie: Record<string, any>; hidden: boolean; pinned: boolean; live: boolean; globallyHidden: boolean;
}
export interface HomeEditorSection extends Omit<HomeSection, 'items'> {
  enabled: boolean; order: number; limit: number; liveCount: number;
  hiddenIds: string[]; pinnedIds: string[]; itemOrder: string[]; items: HomeEditorItem[];
}
export interface HomeEditorData { revision: number; sections: HomeEditorSection[] }
export type HomeSectionPatch = Partial<Pick<HomeEditorSection, 'enabled' | 'hiddenIds' | 'pinnedIds' | 'itemOrder'>>;
type Response = { success: boolean; data: HomeEditorData };
export const homeLayoutService = {
  get: () => api.get<Response>('/admin/home-layout'),
  update: (id: string, revision: number, patch: HomeSectionPatch) => api.put<Response>(`/admin/home-layout/sections/${id}`, { revision, ...patch }),
  order: (revision: number, order: string[]) => api.put<Response>('/admin/home-layout/order', { revision, order }),
  reset: (revision: number) => api.post<Response>('/admin/home-layout/reset', { revision }),
  visibility: (id: string, key: string, hidden: boolean) => api.post<Response>(`/admin/home-layout/sections/${id}/visibility`, { key, hidden }),
};
