import type { Application } from '../../domain/models/types';

export type PipelineColumnId = 
  | 'found' 
  | 'saved' 
  | 'applied' 
  | 'hr' 
  | 'interview' 
  | 'offer' 
  | 'hired'
  | 'rejected';

export interface PipelineColumn {
  id: PipelineColumnId;
  title: string;
  apps: Application[];
  color: string;
  defaultStatus: Application['status'];
  baseStageScore: number;
}

export class ApplicationPipelineService {
  static getColumnMap(apps: Application[]): Record<PipelineColumnId, PipelineColumn> {
    const columns: Record<PipelineColumnId, PipelineColumn> = {
      found: {
        id: 'found',
        title: '🔎 Encontradas',
        apps: [],
        color: 'border-slate-800 bg-slate-900/10',
        defaultStatus: 'found' as any,
        baseStageScore: 30
      },
      saved: {
        id: 'saved',
        title: '⭐ Salvas',
        apps: [],
        color: 'border-blue-500/20 bg-blue-500/5',
        defaultStatus: 'saved' as any,
        baseStageScore: 45
      },
      applied: {
        id: 'applied',
        title: '📨 Aplicadas',
        apps: [],
        color: 'border-cyan-500/20 bg-cyan-500/5',
        defaultStatus: 'applied' as any,
        baseStageScore: 60
      },
      hr: {
        id: 'hr',
        title: '👥 Entrevista RH',
        apps: [],
        color: 'border-purple-500/20 bg-purple-500/5',
        defaultStatus: 'hr' as any,
        baseStageScore: 75
      },
      interview: {
        id: 'interview',
        title: '🎯 Entrevista Gestor',
        apps: [],
        color: 'border-amber-500/20 bg-amber-500/5',
        defaultStatus: 'interview' as any,
        baseStageScore: 85
      },
      offer: {
        id: 'offer',
        title: '🏆 Oferta',
        apps: [],
        color: 'border-pink-500/20 bg-pink-500/5',
        defaultStatus: 'offer' as any,
        baseStageScore: 95
      },
      hired: {
        id: 'hired',
        title: '✅ Contratado',
        apps: [],
        color: 'border-emerald-500/25 bg-emerald-500/5',
        defaultStatus: 'hired' as any,
        baseStageScore: 100
      },
      rejected: {
        id: 'rejected',
        title: '❌ Arquivadas / Rejeitadas',
        apps: [],
        color: 'border-red-500/20 bg-red-500/5',
        defaultStatus: 'rejected' as any,
        baseStageScore: 0
      }
    };

    apps.forEach(app => {
      const status = String(app.status || 'found').toLowerCase();
      if (status === 'found' || status.includes('encontrada') || status.includes('ajustar')) {
        columns.found.apps.push(app);
      } else if (status === 'saved' || status.includes('interesse') || status.includes('prioridade')) {
        columns.saved.apps.push(app);
      } else if (status === 'applied' || status.includes('candidatei') || status.includes('candidatar')) {
        columns.applied.apps.push(app);
      } else if (status === 'hr' || status.includes('recrutador') || status.includes('retorno')) {
        columns.hr.apps.push(app);
      } else if (status === 'interview' || status.includes('gestor') || status.includes('case') || status.includes('cultural')) {
        columns.interview.apps.push(app);
      } else if (status === 'offer' || status.includes('oferta')) {
        columns.offer.apps.push(app);
      } else if (status === 'hired' || status.includes('aceita') || status.includes('contratado')) {
        columns.hired.apps.push(app);
      } else if (status === 'rejected' || status.includes('rejeitada') || status.includes('recusada') || status.includes('fora')) {
        columns.rejected.apps.push(app);
      } else {
        columns.found.apps.push(app);
      }
    });

    return columns;
  }
}
