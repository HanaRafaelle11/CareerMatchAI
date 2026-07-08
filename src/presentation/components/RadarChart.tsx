
interface RadarChartProps {
  scores: {
    technical: number;
    behavioral: number;
    seniority: number;
    overall: number;
    location: number;
  };
  labels?: string[];
}

export function RadarChart({ scores, labels = ['Técnico', 'Comportamental', 'Senioridade', 'Geral', 'Localização'] }: RadarChartProps) {
  const width = 240;
  const height = 240;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 80;
  const totalSides = 5;

  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 / totalSides) * index - Math.PI / 2;
    const x = centerX + radius * (value / 100) * Math.cos(angle);
    const y = centerY + radius * (value / 100) * Math.sin(angle);
    return { x, y };
  };

  // Coordenadas dos vértices de dados
  const points = [
    getCoordinates(0, scores.technical),
    getCoordinates(1, scores.behavioral),
    getCoordinates(2, scores.seniority),
    getCoordinates(3, scores.overall),
    getCoordinates(4, scores.location),
  ];

  const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

  // Linhas de grade em diferentes escalas (25%, 50%, 75%, 100%)
  const gridLevels = [25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl glass-panel glow-brand">
      <svg width={width} height={height} className="overflow-visible">
        {/* Renderizar círculos ou polígonos de grade */}
        {gridLevels.map((level, lIdx) => {
          const gridPoints = Array.from({ length: totalSides }).map((_, sIdx) => {
            const angle = (Math.PI * 2 / totalSides) * sIdx - Math.PI / 2;
            const x = centerX + radius * (level / 100) * Math.cos(angle);
            const y = centerY + radius * (level / 100) * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ');

          return (
            <polygon
              key={`grid-${lIdx}`}
              points={gridPoints}
              fill="none"
              className="radar-grid"
              strokeDasharray={lIdx === 3 ? "0" : "2 2"}
            />
          );
        })}

        {/* Eixos do radar */}
        {Array.from({ length: totalSides }).map((_, idx) => {
          const target = getCoordinates(idx, 100);
          const labelPos = getCoordinates(idx, 120); // Posiciona rótulo mais externamente
          
          return (
            <g key={`axis-${idx}`}>
              <line
                x1={centerX}
                y1={centerY}
                x2={target.x}
                y2={target.y}
                className="radar-grid opacity-50"
              />
              <text
                x={labelPos.x}
                y={labelPos.y + 4}
                textAnchor="middle"
                className="text-[10px] font-semibold fill-slate-400 dark:fill-slate-500 font-sans uppercase tracking-wider"
              >
                {labels[idx]}
              </text>
            </g>
          );
        })}

        {/* Polígono da área do Match */}
        <polygon
          points={pointsString}
          fill="rgba(34, 197, 94, 0.2)"
          stroke="#22c55e"
          strokeWidth="2"
          className="transition-all duration-500 ease-in-out"
        />

        {/* Pontos nos vértices de dados */}
        {points.map((p, idx) => (
          <circle
            key={`point-${idx}`}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#22c55e"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="transition-all duration-500 ease-in-out hover:scale-150 cursor-pointer"
          />
        ))}
      </svg>

      <div className="mt-4 flex gap-4 text-xs font-medium text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
          <span>Aderência Semântica</span>
        </div>
      </div>
    </div>
  );
}
