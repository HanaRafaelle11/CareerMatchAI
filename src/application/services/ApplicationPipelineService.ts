import type { Application } from '../../domain/models/types';

export type PipelineColumnId = 
  | 'encontradas' 
  | 'aplicar_depois' 
  | 'cv_enviado' 
  | 'triagem' 
  | 'entrevista_rh' 
  | 'entrevista_tecnica' 
  | 'case_tecnico' 
  | 'oferta' 
  | 'contratado' 
  | 'recusado' 
  | 'arquivado';

export interface PipelineColumn {
  id: PipelineColumnId;
  title: string;
  apps: Application[];
  color: string;
  defaultStatus: Application['status'];
}

export class ApplicationPipelineService {
  static getColumnMap(apps: Application[]): Record<PipelineColumnId, PipelineColumn> {
    const columns: Record<PipelineColumnId, PipelineColumn> = {
      encontradas: {
        id: 'encontradas',
        title: '🔎 Encontradas',
        apps: [],
        color: 'border-slate-800 bg-slate-900/10',
        defaultStatus: '🔎 Encontrada'
      },
      aplicar_depois: {
        id: 'aplicar_depois',
        title: '⭐ Aplicar Depois',
        apps: [],
        color: 'border-blue-500/10 bg-blue-500/5',
        defaultStatus: '⭐ Tenho interesse'
      },
      cv_enviado: {
        id: 'cv_enviado',
        title: '📨 CV Enviado',
        apps: [],
        color: 'border-cyan-500/10 bg-cyan-500/5',
        defaultStatus: '📨 Me candidatei'
      },
      triagem: {
        id: 'triagem',
        title: '⏳ Triagem',
        apps: [],
        color: 'border-purple-500/10 bg-purple-500/5',
        defaultStatus: '⏳ Aguardando retorno' as any // status unificado
      },
      entrevista_rh: {
        id: 'entrevista_rh',
        title: '👥 Entrevista RH',
        apps: [],
        color: 'border-amber-500/10 bg-amber-500/5',
        defaultStatus: '👥 Entrevista com recrutador'
      },
      entrevista_tecnica: {
        id: 'entrevista_tecnica',
        title: '🎯 Entr. Técnica',
        apps: [],
        color: 'border-orange-500/10 bg-orange-500/5',
        defaultStatus: '🎯 Entrevista com gestor' as any
      },
      case_tecnico: {
        id: 'case_tecnico',
        title: '🧩 Case Técnico',
        apps: [],
        color: 'border-violet-500/10 bg-violet-500/5',
        defaultStatus: '🧩 Case técnico'
      },
      oferta: {
        id: 'oferta',
        title: '🏆 Oferta',
        apps: [],
        color: 'border-pink-500/10 bg-pink-500/5',
        defaultStatus: '🏆 Oferta recebida'
      },
      contratado: {
        id: 'contratado',
        title: '✅ Contratado',
        apps: [],
        color: 'border-emerald-500/15 bg-emerald-500/5',
        defaultStatus: '✅ Aceita' as any
      },
      recusado: {
        id: 'recusado',
        title: '❌ Recusado',
        apps: [],
        color: 'border-red-500/10 bg-red-500/5',
        defaultStatus: '❌ Rejeitada' as any
      },
      arquivado: {
        id: 'arquivado',
        title: '🚫 Arquivado',
        apps: [],
        color: 'border-slate-700 bg-slate-900/5',
        defaultStatus: '🚫 Fora do meu objetivo' as any
      }
    };

    apps.forEach(app => {
      const status = app.status;
      if (status === '🔎 Encontrada') {
        columns.encontradas.apps.push(app);
      } else if (status === '⭐ Tenho interesse' || status === '📝 Vou me candidatar') {
        columns.aplicar_depois.apps.push(app);
      } else if (status === '📨 Me candidatei') {
        columns.cv_enviado.apps.push(app);
      } else if (status === '⏳ Aguardando retorno' || (status as string) === '⏳ Retorno') {
        columns.triagem.apps.push(app);
      } else if (status === '👥 Entrevista com recrutador' || (status as string) === '👥 Entrevista RH') {
        columns.entrevista_rh.apps.push(app);
      } else if (status === '🎯 Entrevista com gestor' || (status as string) === '🎯 Entrevista Gestor') {
        columns.entrevista_tecnica.apps.push(app);
      } else if (status === '🧩 Case técnico' || (status as string) === '🧩 Case Técnico' || status === '🤝 Fit cultural' || (status as string) === '🤝 Fit Cultural') {
        columns.case_tecnico.apps.push(app);
      } else if (status === '🏆 Oferta recebida' || (status as string) === '🏆 Oferta Recebida') {
        columns.oferta.apps.push(app);
      } else if (status === '✅ Aceita') {
        columns.contratado.apps.push(app);
      } else if (status === '❌ Rejeitada') {
        columns.recusado.apps.push(app);
      } else {
        columns.arquivado.apps.push(app);
      }
    });

    return columns;
  }
}
