const fs = require('fs');

try {
  const raw = fs.readFileSync('./lh-results.json', 'utf8');
  const data = JSON.parse(raw);

  const categories = data.categories || {};
  const audits = data.audits || {};

  const report = {
    performanceScore: Math.round((categories.performance?.score || 0) * 100),
    accessibilityScore: Math.round((categories.accessibility?.score || 0) * 100),
    bestPracticesScore: Math.round((categories['best-practices']?.score || 0) * 100),
    seoScore: Math.round((categories.seo?.score || 0) * 100),

    fcp: audits['first-contentful-paint']?.displayValue || audits['first-contentful-paint']?.numericValue + ' ms',
    lcp: audits['largest-contentful-paint']?.displayValue || audits['largest-contentful-paint']?.numericValue + ' ms',
    cls: audits['cumulative-layout-shift']?.displayValue || audits['cumulative-layout-shift']?.numericValue,
    tbt: audits['total-blocking-time']?.displayValue || audits['total-blocking-time']?.numericValue + ' ms',
    speedIndex: audits['speed-index']?.displayValue || audits['speed-index']?.numericValue + ' ms',

    domSize: audits['dom-size']?.displayValue || audits['dom-size']?.numericValue,
    jsTransferSize: audits['total-byte-weight']?.details?.items?.find(i => i.url?.includes('.js'))?.transferSize || 'N/A',
    lcpElement: audits['largest-contentful-paint-element']?.details?.items?.[0]?.node?.snippet || audits['largest-contentful-paint-element']?.displayValue || 'N/A'
  };

  console.log('=== LIGHTHOUSE REPORT VERIFICADO EM PRODUÇÃO (vocentro.com.br) ===');
  console.log(JSON.stringify(report, null, 2));

  // Salvar resumo simplificado em json
  fs.writeFileSync('./lh-summary.json', JSON.stringify(report, null, 2));
} catch (e) {
  console.error('Erro ao ler lh-results.json:', e.message);
}
