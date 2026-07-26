const fs = require('fs');

try {
  const raw = fs.readFileSync('./lh-results.json', 'utf8');
  const data = JSON.parse(raw);

  const audits = data.audits || {};
  const categories = data.categories || {};

  console.log('--- SCORE GERAL ---');
  console.log('Performance:', Math.round(categories.performance.score * 100));
  console.log('Accessibility:', Math.round(categories.accessibility.score * 100));
  console.log('Best Practices:', Math.round(categories['best-practices'].score * 100));
  console.log('SEO:', Math.round(categories.seo.score * 100));

  console.log('\n--- MÉTRICAS CORE WEB VITAL ---');
  console.log('FCP (First Contentful Paint):', audits['first-contentful-paint']?.displayValue);
  console.log('LCP (Largest Contentful Paint):', audits['largest-contentful-paint']?.displayValue);
  console.log('CLS (Cumulative Layout Shift):', audits['cumulative-layout-shift']?.displayValue);
  console.log('TBT (Total Blocking Time):', audits['total-blocking-time']?.displayValue);
  console.log('Speed Index:', audits['speed-index']?.displayValue);

  console.log('\n--- ESTRUTURA & REDE ---');
  console.log('Tamanho do DOM (elementos):', audits['dom-size']?.displayValue || audits['dom-size']?.numericValue);
  
  const byteItems = audits['network-requests']?.details?.items || [];
  const jsBytes = byteItems
    .filter(i => i.resourceType === 'Script' || i.url.endsWith('.js'))
    .reduce((acc, curr) => acc + (curr.transferSize || 0), 0);

  console.log('Quantidade de JS Transferido (bytes):', (jsBytes / 1024).toFixed(2) + ' KB');

  const lcpItem = audits['largest-contentful-paint-element']?.details?.items?.[0];
  console.log('Largest Contentful Paint Element:', lcpItem?.node?.snippet || lcpItem?.node?.nodeLabel || 'N/A');

  console.log('\n--- AUDITORIA DE ACESSIBILIDADE ---');
  const accAudits = Object.values(audits).filter(a => a.id && a.score !== null && a.score < 1 && categories.accessibility?.auditRefs?.some(r => r.id === a.id));
  accAudits.forEach(a => {
    console.log(`- [${a.id}] ${a.title}: ${a.explanation || a.description}`);
  });

} catch (e) {
  console.error('Erro:', e);
}
