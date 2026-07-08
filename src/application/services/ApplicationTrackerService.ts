import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import type { ApplicationStage } from '../../domain/models/types';

export class ApplicationTrackerService {
  async getStages(applicationId: string): Promise<ApplicationStage[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('application_stages')
        .select('*')
        .eq('application_id', applicationId)
        .order('stage_date', { ascending: true });

      if (error) throw error;
      return (data || []).map(d => ({
        id: d.id,
        applicationId: d.application_id,
        stageName: d.stage_name,
        status: d.status,
        notes: d.notes || undefined,
        stageDate: d.stage_date,
        createdAt: d.created_at
      }));
    } else {
      return localDB.getApplicationStages(applicationId);
    }
  }

  async addStage(applicationId: string, stage: Omit<ApplicationStage, 'id' | 'createdAt'>): Promise<ApplicationStage> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('application_stages')
        .insert({
          application_id: applicationId,
          stage_name: stage.stageName,
          status: stage.status,
          notes: stage.notes || null,
          stage_date: stage.stageDate
        })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        applicationId: data.application_id,
        stageName: data.stage_name,
        status: data.status,
        notes: data.notes || undefined,
        stageDate: data.stage_date,
        createdAt: data.created_at
      };
    } else {
      const newStage: ApplicationStage = {
        ...stage,
        id: `stage-${Date.now()}`,
        applicationId,
        createdAt: new Date().toISOString()
      };
      return localDB.saveApplicationStage(newStage);
    }
  }

  async deleteStage(stageId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('application_stages')
        .delete()
        .eq('id', stageId);

      if (error) throw error;
    } else {
      localDB.deleteApplicationStage(stageId);
    }
  }
}

export const applicationTrackerService = new ApplicationTrackerService();
