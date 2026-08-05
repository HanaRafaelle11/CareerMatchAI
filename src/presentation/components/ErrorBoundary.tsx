import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { VocentroLogo } from './ds/MyCareerIcons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CRITICAL ERROR BOUNDARY CAPTURED]', error, errorInfo);
  }

  private handleReload = () => {
    // Se for erro de módulo dinâmico/chunk antigo pós-deploy, recarrega limpando cache da página
    if (this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('Loading chunk')) {
      window.location.reload();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)]" />

          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-xl flex flex-col items-center text-center space-y-6 relative shadow-2xl z-10">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <VocentroLogo className="h-8 mx-auto mb-2" showText={true} />
              <h2 className="text-xl font-bold font-display text-white">
                Algo não saiu como esperado
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Identificamos uma falha temporária ao carregar a interface da plataforma. Clique no botão abaixo para restaurar o sistema.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-850 text-left font-mono text-[11px] text-slate-400 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-bold text-xs shadow-lg hover:shadow-brand-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={16} />
              <span>Recarregar Plataforma</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
