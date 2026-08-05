import React, { useEffect } from 'react';

declare global {
  interface Window {
    _linkedin_partner_id?: string;
    _linkedin_data_partner_ids?: string[];
    lintrk?: any;
  }
}

interface LinkedInInsightTagProps {
  partnerId?: string;
}

export const LinkedInInsightTag: React.FC<LinkedInInsightTagProps> = ({ partnerId: customPartnerId }) => {
  const partnerId = customPartnerId || (import.meta.env.VITE_LINKEDIN_PARTNER_ID as string);

  useEffect(() => {
    // 1. Validar que possui Partner ID configurado
    if (!partnerId) {
      return;
    }

    // 2. Trava de ambiente: Executar SOMENTE em produção e NÃO em localhost / staging
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
    const isProduction = import.meta.env.PROD || hostname === 'vocentro.com.br' || hostname === 'www.vocentro.com.br';

    if (isLocalhost || !isProduction) {
      console.log('[Analytics] LinkedIn Insight Tag desativado em ambiente de desenvolvimento/staging.');
      return;
    }

    // 3. Garantir idempotência: Evitar duplicação de scripts
    if (document.getElementById('linkedin-insight-script') || window._linkedin_partner_id) {
      return;
    }

    // 4. Configurar variáveis globais do LinkedIn Insight Tag
    window._linkedin_partner_id = partnerId;
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    if (!window._linkedin_data_partner_ids.includes(partnerId)) {
      window._linkedin_data_partner_ids.push(partnerId);
    }

    // 5. Inicializar fila de rastreamento do lintrk
    if (!window.lintrk) {
      window.lintrk = function (a: any, b: any) {
        window.lintrk.q.push([a, b]);
      };
      window.lintrk.q = [];
    }

    // 6. Inserir dinamicamente a tag de script do LinkedIn
    const script = document.createElement('script');
    script.id = 'linkedin-insight-script';
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';

    // Compatibilidade com CSP (Content Security Policy)
    const nonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content');
    if (nonce) {
      script.setAttribute('nonce', nonce);
    }

    document.head.appendChild(script);
  }, [partnerId]);

  if (!partnerId) {
    return null;
  }

  // Fallback noscript para navegadores com JavaScript desativado
  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        alt=""
        src={`https://px.ads.linkedin.com/collect/?pid=${encodeURIComponent(partnerId)}&fmt=gif`}
      />
    </noscript>
  );
};
