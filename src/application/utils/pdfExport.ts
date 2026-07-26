/**
 * Helper utility to export HTML elements as PDF by rendering them in a print-friendly document
 * and triggering the browser's native print manager dialog across desktop and mobile devices.
 */
export const printElementHtml = (title: string, htmlContent: string) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // Popup bloqueado: fallback utilizando iframe embutido na página
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(generatePrintDocumentHtml(title, htmlContent, false));
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 500);
    } else {
      alert("Falha ao gerar impressão. Por favor, desabilite o bloqueador de pop-ups do seu navegador.");
    }
    return;
  }

  printWindow.document.write(generatePrintDocumentHtml(title, htmlContent, !isMobile));
  printWindow.document.close();
};

const generatePrintDocumentHtml = (title: string, htmlContent: string, autoClose: boolean): string => {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #1e293b;
            background: #ffffff;
            line-height: 1.5;
            margin: 0;
            padding: 16px;
            font-size: 11pt;
          }
          h1, h2, h3, h4 {
            color: #0f172a;
            margin-top: 0;
            font-weight: 700;
          }
          h1 {
            font-size: 18pt;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 8px;
            margin-bottom: 16px;
          }
          h2 {
            font-size: 13pt;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          p {
            margin: 0 0 8px 0;
          }
          ul {
            margin: 0 0 12px 0;
            padding-left: 18px;
          }
          li {
            margin-bottom: 4px;
          }
          .card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
            background: #f8fafc;
            page-break-inside: avoid;
          }
          .card-title {
            font-weight: 700;
            font-size: 10pt;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #4338ca;
            margin-bottom: 6px;
          }
          .footer {
            margin-top: 30px;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            text-align: center;
            font-size: 8.5pt;
            color: #94a3b8;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px; padding: 12px; background: #e0e7ff; border-radius: 8px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-weight: bold; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
            🖨️ Salvar como PDF / Imprimir
          </button>
        </div>
        ${htmlContent}
        <div class="footer">
          Relatório gerado pelo Vocentro - Inteligência Artificial para Aceleração de Carreira. www.vocentro.com.br
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              ${autoClose ? 'setTimeout(function() { window.close(); }, 1000);' : ''}
            }, 400);
          };
        </script>
      </body>
    </html>
  `;
};
