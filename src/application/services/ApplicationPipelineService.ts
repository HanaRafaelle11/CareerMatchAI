import type { Application } from '../../domain/models/types';

export type PipelineColumnId = 'encontradas' | 'preparando' | 'aplicadas' | 'entrevistas' | 'cases' | 'ofertas_fim';

export interface PipelineColumn {
  id: PipelineColumnId;
  title: string;
  apps: Application[];
  color: string;
}

export class ApplicationPipelineService {
  static getColumnMap(apps: Application[]): Record<PipelineColumnId, PipelineColumn> {
    const columns: Record<PipelineColumnId, PipelineColumn> = {
      encontradas: {
        id: 'encontradas',
        title: '🔎 Encontradas',
        apps: [],
        color: 'border-slate-800 bg-slate-900/10'
      },
      preparando: {
        id: 'preparando',
        title: '📝 Preparando',
        apps: [],
        color: 'border-blue-500/20 bg-blue-500/5'
      },
      aplicadas: {
        id: 'aplicadas',
        title: '📨 Aplicadas',
        apps: [],
        color: 'border-indigo-500/20 bg-indigo-500/5'
      },
      entrevistas: {
        id: 'entrevistas',
        title: '👥 Entrevistas',
        apps: [],
        color: 'border-amber-500/20 bg-amber-500/5'
      },
      cases: {
        id: 'cases',
        title: '🧩 Case Técnico',
        apps: [],
        color: 'border-purple-500/20 bg-purple-500/5'
      },
      ofertas_fim: {
        id: 'ofertas_fim',
        title: '🏆 Ofertas & Fim',
        apps: [],
        color: 'border-emerald-500/20 bg-emerald-500/5'
      }
    };

    apps.forEach(app => {
      const status = app.status;
      if (
        status === '🔎 Encontrada' ||
        status === '⭐ Tenho interesse' ||
        status === '🚫 Fora do meu objetivo' ||
        status === '👻 Sem resposta'
      ) {
        columns.encontradas.apps.push(app);
      } else if (status === '📝 Vou me candidatar') {
        columns.preparando.apps.push(app);
      } else if (status === '📨 Me candidatei' || status === '⏳ Aguardando retorno') {
        columns.aplicadas.apps.push(app);
      } else if (
        status === '👥 Entrevista com recrutador' ||
        status === '🎯 Entrevista com gestor' ||
        status === '🤝 Fit cultural'
      ) {
        columns.entrevistas.apps.push(app);
      } else if (status === '🧩 Case técnico') {
        columns.cases.apps.push(app);
      } else if (status === '🏆 Oferta recebida' || status === '✅ Aceita' || status === '❌ Rejeitada') {
        columns.ofertas_fim.apps.push(app);
      }
    });

    return columns;
  }
}
