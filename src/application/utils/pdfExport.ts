/**
 * Helper utility to export HTML elements as PDF by rendering them in a print-friendly document
 * and triggering the browser's native print manager dialog.
 */
export const printElementHtml = (title: string, htmlContent: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Falha ao abrir janela de impressão. Por favor, desabilite bloqueadores de pop-up e tente novamente.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #1e293b;
            background: #ffffff;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            font-size: 11pt;
          }
          h1, h2, h3, h4 {
            color: #0f172a;
            margin-top: 0;
            font-weight: 700;
          }
          h1 {
            font-size: 20pt;
            border-bottom: 2px solid #6366f1;
            padding-bottom: 8px;
            margin-bottom: 20px;
          }
          h2 {
            font-size: 14pt;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-top: 25px;
            margin-bottom: 12px;
          }
          h3 {
            font-size: 12pt;
            margin-top: 15px;
            margin-bottom: 8px;
          }
          p {
            margin: 0 0 10px 0;
          }
          ul {
            margin: 0 0 15px 0;
            padding-left: 20px;
          }
          li {
            margin-bottom: 6px;
          }
          .header-table {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: collapse;
          }
          .header-table td {
            vertical-align: top;
            padding: 0;
          }
          .header-info {
            text-align: right;
            font-size: 9.5pt;
            color: #64748b;
          }
          .grid-2 {
            display: table;
            width: 100%;
            table-layout: fixed;
            margin-bottom: 20px;
          }
          .grid-col {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 15px;
          }
          .grid-col:last-child {
            padding-right: 0;
            padding-left: 15px;
          }
          .card {
            border: 1.5px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background: #f8fafc;
          }
          .card-title {
            font-weight: 700;
            font-size: 10.5pt;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #4f46e5;
            margin-bottom: 8px;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            background: #e0e7ff;
            color: #4338ca;
            border-radius: 4px;
            font-size: 8.5pt;
            font-weight: 600;
            text-transform: uppercase;
          }
          .badge-success {
            background: #d1fae5;
            color: #065f46;
          }
          .score-grid {
            display: table;
            width: 100%;
            table-layout: fixed;
            margin-bottom: 25px;
          }
          .score-card {
            display: table-cell;
            text-align: center;
            border: 1.5px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            background: #faf5ff;
            width: 33.33%;
          }
          .score-card:not(:last-child) {
            margin-right: 10px; /* Note: table-cell margins don't work, so border spacing or padding is used. */
          }
          .score-val {
            font-size: 24pt;
            font-weight: 800;
            color: #7c3aed;
            line-height: 1;
            margin-bottom: 4px;
          }
          .score-label {
            font-size: 8.5pt;
            font-weight: 600;
            color: #6b21a8;
            text-transform: uppercase;
          }
          .experience-item {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px dashed #e2e8f0;
          }
          .experience-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          .experience-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 4px;
          }
          .experience-role {
            font-weight: 700;
            font-size: 11pt;
            color: #0f172a;
          }
          .experience-meta {
            font-size: 9.5pt;
            color: #64748b;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
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
              display: none;
            }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <div class="footer">
          Relatório gerado pelo Vocentro - Inteligência Artificial para Aceleração de Carreira. www.vocentro.com.br
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
