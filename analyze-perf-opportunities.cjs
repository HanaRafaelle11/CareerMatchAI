const fs = require('fs');

try {
  const raw = fs.readFileSync('./lh-results.json', 'utf8');
  const data = JSON.parse(raw);

  const perfCat = data.categories.performance;
  const auditRefs = perfCat.auditRefs;
  const audits = data.audits;

  console.log('=== WEIGHTS DE PERFORMANCE NO LIGHTHOUSE ===');
  auditRefs.forEach(ref => {
    const audit = audits[ref.id];
    if (audit) {
      console.log(`- [${ref.id}] Weight: ${ref.weight} | Score: ${audit.score} | Display: ${audit.displayValue || audit.numericValue}`);
    }
  });

  console.log('\n=== OPORTUNIDADES E AUDITORIAS DE DESEMPENHO COM FALHA OU ESPAÇO DE MELHORIA ===');
  const opportunities = [];

  Object.values(audits).forEach(audit => {
    if (audit.details && (audit.details.type === 'opportunity' || audit.score < 1) && audit.score !== null) {
      const overallSavingsMs = audit.details.overallSavingsMs || 0;
      const overallSavingsBytes = audit.details.overallSavingsBytes || 0;

      if (overallSavingsMs > 0 || overallSavingsBytes > 0 || audit.score < 0.9) {
        opportunities.push({
          id: audit.id,
          title: audit.title,
          score: audit.score,
          displayValue: audit.displayValue,
          savingsMs: overallSavingsMs,
          savingsBytes: overallSavingsBytes,
          description: audit.description,
          items: audit.details.items ? audit.details.items.length : 0,
          itemDetails: audit.details.items ? audit.details.items.slice(0, 3) : []
        });
      }
    }
  });

  opportunities.sort((a, b) => (b.savingsMs || 0) - (a.savingsMs || 0) || (b.savingsBytes || 0) - (a.savingsBytes || 0));

  console.log(JSON.stringify(opportunities, null, 2));

} catch (e) {
  console.error('Erro ao analisar lh-results.json:', e);
}
