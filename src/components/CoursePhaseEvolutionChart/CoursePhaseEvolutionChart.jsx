import { useMemo, useState, useEffect } from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Area,
} from 'recharts'
import styles from './CoursePhaseEvolutionChart.module.css'

/**
 * CustomTooltip para o gráfico de evolução de fases
 * Mostra os valores com 1 decimal, exibe "—" para valores nulos
 */
function CustomTooltip({ active, payload, label, maxHistoricalYear }) {
  if (!active || !payload?.length) return null

  const year = Number(label);
  
  // Filtra o payload para evitar duplicados no ano de transição e esconder linhas técnicas
  const filteredPayload = payload.filter(entry => {
    const isPrediction = entry.dataKey.includes('_pred') || entry.dataKey.includes('_high') || entry.dataKey.includes('_low');
    
    if (year <= maxHistoricalYear) {
      return !isPrediction; // No histórico, mostramos apenas os dados reais
    }
    return isPrediction; // Na previsão, mostramos o valor previsto e os intervalos (high/low)
  });

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>Ano: {label}</p>
      {filteredPayload.map((entry, idx) => {
        let color = entry.color;

        // Garante que a cor no tooltip corresponde à fase, corrigindo as previsões que usam stroke="none"
        if (entry.dataKey?.startsWith('fase_1')) {
          color = '#2563eb'
        } else if (entry.dataKey?.startsWith('fase_2')) {
          color = '#10b981'
        } else if (entry.dataKey?.startsWith('fase_3')) {
          color = '#f59e0b'
        }

        return (
          <p key={idx} style={{ color }} className={styles.tooltipValue}>
            {entry.name}: {entry.value !== null ? entry.value.toFixed(1) : '—'}
          </p>
        )
      })}
    </div>
  )
}

/**
 * Card para exibir previsão de uma fase
 */
function PredictionCard({ phase, prediction, phaseLabel, color }) {
  if (!prediction) return null

  return (
    <div className={styles.predictionCard}>
      <div className={styles.predictionHeader}>
        <span className={styles.predictionLabel}>{phaseLabel}</span>
        <span className={styles.predictionYear}>Ano {prediction.year}</span>
      </div>
      <div className={styles.predictionValue} style={{ color }}>
        {prediction.predicted.toFixed(1)}
      </div>
      <div className={styles.confidenceInterval}>
        <span className={styles.ciLabel}>IC 95%:</span>
        <span className={styles.ciValue}>
          {prediction.ciLow.toFixed(1)} - {prediction.ciHigh.toFixed(1)}
        </span>
      </div>
    </div>
  )
}

/**
 * Componente para exibir a evolução das notas de um curso por fases
 * com suporte a previsões
 */
export default function CoursePhaseEvolutionChart({
  data = [],
  predictions = null,
  courseName = 'Curso',
  minYear = null,
  maxYear = null,
  isLoading = false,
  error = null,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Deteta se o ecrã é pequeno o suficiente para precisar de expansão
  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 550);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);
  const showExpandButton = isMobile || isExpanded;

  // Calcula estatísticas dos dados históricos
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null

    const avg = (key) => {
      const vals = data.filter(d => d[key] != null).map(d => d[key])
      return vals.length ? vals.reduce((a, b) => a + b) / vals.length : null
    }

    return {
      avgFase1: avg('fase_1'),
      avgFase2: avg('fase_2'),
      avgFase3: avg('fase_3'),
    }
  }, [data])

  // Combina dados históricos com previsões
  const combinedData = useMemo(() => {
    if (!predictions) return data

    const combined = data.map(d => ({ ...d }))
    const maxYear = Math.max(...data.map(d => Number(d.year)))

    // Ponto de ligação: define o valor inicial da previsão como o último valor histórico
    // para permitir que o connectNulls desenhe a linha a tracejado desde o último ponto real.
    const lastHistorical = combined.find(d => Number(d.year) === maxYear)
    if (lastHistorical) {
      if (predictions.fase_1?.length > 0) {
        lastHistorical.fase_1_pred = lastHistorical.fase_1
        lastHistorical.fase_1_low = lastHistorical.fase_1
        lastHistorical.fase_1_high = lastHistorical.fase_1
      }
      if (predictions.fase_2?.length > 0) {
        lastHistorical.fase_2_pred = lastHistorical.fase_2
        lastHistorical.fase_2_low = lastHistorical.fase_2
        lastHistorical.fase_2_high = lastHistorical.fase_2
      }
      if (predictions.fase_3?.length > 0) {
        lastHistorical.fase_3_pred = lastHistorical.fase_3
        lastHistorical.fase_3_low = lastHistorical.fase_3
        lastHistorical.fase_3_high = lastHistorical.fase_3
      }
    }

    for (let i = 1; i <= 1; i++) {
      const year = maxYear + i
      let entry = combined.find(d => Number(d.year) === year)

      if (!entry) {
        entry = { year }
        combined.push(entry)
      }

      if (predictions.fase_1?.[i - 1]) {
        entry.fase_1_pred = predictions.fase_1[i - 1].predicted
        entry.fase_1_low = predictions.fase_1[i - 1].ciLow
        entry.fase_1_high = predictions.fase_1[i - 1].ciHigh
      }
      if (predictions.fase_2?.[i - 1]) {
        entry.fase_2_pred = predictions.fase_2[i - 1].predicted
        entry.fase_2_low = predictions.fase_2[i - 1].ciLow
        entry.fase_2_high = predictions.fase_2[i - 1].ciHigh
      }
      if (predictions.fase_3?.[i - 1]) {
        entry.fase_3_pred = predictions.fase_3[i - 1].predicted
        entry.fase_3_low = predictions.fase_3[i - 1].ciLow
        entry.fase_3_high = predictions.fase_3[i - 1].ciHigh
      }
    }

    return combined.sort((a, b) => Number(a.year) - Number(b.year))
  }, [data, predictions])

  const yAxisDomain = () => [0, 200]

  if (isLoading && (!data || data.length === 0)) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>A carregar dados...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>Erro ao carregar dados: {error.message}</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.noData}>Sem dados disponíveis para este curso</p>
      </div>
    )
  }

  const maxHistoricalYear = Math.max(...data.map((d) => Number(d.year)))

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ flex: 1 }}>
          <h3 className={styles.title}>Evolução das Notas por Fase</h3>
          {minYear && maxYear && (
            <p className={styles.subtitle}>
              Dados históricos de {minYear} a {maxYear}
              {predictions && ' + Previsões'}
            </p>
          )}
        </div>
      </div>

      {showExpandButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            backgroundColor: isExpanded ? '#2563eb' : '#f3f4f6',
            color: isExpanded ? 'white' : '#4b5563',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            height: 'fit-content',
            marginRight: '12px'
          }}
        >
          {isExpanded ? '✕ Reduzir' : '↔️ Expandir'}
        </button>
      )}

      <div className={styles.chartWrapper} style={{ 
        overflowX: isExpanded ? 'auto' : 'hidden', 
        WebkitOverflowScrolling: 'touch' 
      }}>
        <ResponsiveContainer width="100%" height={320} minWidth={isExpanded ? 470 : undefined}>
          <ComposedChart data={combinedData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#4b5563' }} />
            <YAxis domain={yAxisDomain()} tick={{ fontSize: 10, fill: '#4b5563' }} />
            <Tooltip content={<CustomTooltip maxHistoricalYear={maxHistoricalYear} />} />

            {predictions && (
              <ReferenceLine
                x={maxHistoricalYear + 0.5}
                stroke="#d1d5db"
                strokeDasharray="5 5"
                label={{
                  value: 'Histórico / Previsão',
                  position: 'top',
                  fill: '#6b7280',
                  fontSize: 10,
                }}
              />
            )}

            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={10}
              formatter={(value) => <span style={{ fontSize: '12px', color: '#4b5563' }}>{value}</span>}
              wrapperStyle={{ 
                paddingTop: '20px',
                position: 'relative'
              }}
            />

            {/* Linhas de dados históricos */}
            <Line
              type="linear"
              dataKey="fase_1"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 5, fill: '#2563eb' }}
              isAnimationActive={false}
              connectNulls
              name="Fase 1"
            />
            <Line
              type="linear"
              dataKey="fase_2"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 5, fill: '#10b981' }}
              isAnimationActive={false}
              connectNulls
              name="Fase 2"
            />
            <Line
              type="linear"
              dataKey="fase_3"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 5, fill: '#f59e0b' }}
              isAnimationActive={false}
              connectNulls
              name="Fase 3"
            />

            {/* Linhas de previsões (tracejadas) */}
            {predictions && (
              <>
                <Line
                  type="linear"
                  dataKey="fase_1_pred"
                  stroke="#2563eb"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={(props) => {
                    const { cx, cy, payload, value } = props
                    if (payload.year <= maxHistoricalYear || value === null || value === undefined) return null
                    return <circle cx={cx} cy={cy} r={4} fill="#2563eb" />
                  }}
                  isAnimationActive={false}
                  connectNulls
                  name="Fase 1 (Previsão)"
                  legendType="none"
                />
                <Line
                  type="linear"
                  dataKey="fase_1_high"
                  name="Fase 1 (Máximo)"
                  stroke="#2563eb"
                  strokeWidth={0}
                  dot={false} // Remove os pontos da linha
                  legendType="none"
                />
                <Line
                  type="linear"
                  dataKey="fase_1_low"
                  name="Fase 1 (Mínimo)"
                  stroke="#2563eb"
                  strokeWidth={0}
                  dot={false} // Remove os pontos da linha
                  legendType="none"
                />
                <Line
                  type="linear"
                  dataKey="fase_2_pred"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={(props) => {
                    const { cx, cy, payload, value } = props
                    if (payload.year <= maxHistoricalYear || value === null || value === undefined) return null
                    return <circle cx={cx} cy={cy} r={4} fill="#10b981" />
                  }}
                  isAnimationActive={false}
                  connectNulls
                  name="Fase 2 (Previsão)"
                  legendType="none"
                />
                <Line
                  type="linear"
                  dataKey="fase_2_high"
                  name="Fase 2 (Máximo)"
                  stroke="#10b981"
                  strokeWidth={0}
                  dot={false} // Remove os pontos da linha
                  legendType="none"
                />
                <Line
                  type="linear"
                  dataKey="fase_2_low"
                  name="Fase 2 (Mínimo)"
                  stroke="#10b981"
                  strokeWidth={0}
                  dot={false} // Remove os pontos da linha
                  legendType="none"
                />
                <Line
                  type="linear"
                  dataKey="fase_3_pred"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={(props) => {
                    const { cx, cy, payload, value } = props
                    if (payload.year <= maxHistoricalYear || value === null || value === undefined) return null
                    return <circle cx={cx} cy={cy} r={4} fill="#f59e0b" />
                  }}
                  isAnimationActive={false}
                  connectNulls
                  name="Fase 3 (Previsão)"
                  legendType="none"
                />
                <Line
                  type="linear"
                  dataKey="fase_3_high"
                  name="Fase 3 (Máximo)"
                  stroke="#f59e0b"
                  strokeWidth={0}
                  dot={false} // Remove os pontos da linha
                  legendType="none"
                />
                <Line
                  type="linear"
                  dataKey="fase_3_low"
                  name="Fase 3 (Mínimo)"
                  stroke="#f59e0b"
                  strokeWidth={0}
                  dot={false} // Remove os pontos da linha
                  legendType="none"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Estatísticas históricas */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <p className={styles.statLabel}>Média Fase 1</p>
            <p className={styles.statValue} style={{ color: '#2563eb' }}>
              {stats.avgFase1 ? stats.avgFase1.toFixed(1) : '—'}
            </p>
          </div>
          <div className={styles.statBox}>
            <p className={styles.statLabel}>Média Fase 2</p>
            <p className={styles.statValue} style={{ color: '#10b981' }}>
              {stats.avgFase2 ? stats.avgFase2.toFixed(1) : '—'}
            </p>
          </div>
          <div className={styles.statBox}>
            <p className={styles.statLabel}>Média Fase 3</p>
            <p className={styles.statValue} style={{ color: '#f59e0b' }}>
              {stats.avgFase3 ? stats.avgFase3.toFixed(1) : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Previsões */}
      {predictions && (
        <div className={styles.predictionsSection}>
          <h4 className={styles.predictionsTitle}>Previsões para o Próximo Ano</h4>
          <div className={styles.predictionsGrid}>
            <PredictionCard
              phase="fase_1"
              prediction={predictions.fase_1?.[0]}
              phaseLabel="Fase 1"
              color="#2563eb"
            />
            <PredictionCard
              phase="fase_2"
              prediction={predictions.fase_2?.[0]}
              phaseLabel="Fase 2"
              color="#10b981"
            />
            <PredictionCard
              phase="fase_3"
              prediction={predictions.fase_3?.[0]}
              phaseLabel="Fase 3"
              color="#f59e0b"
            />
          </div>
        </div>
      )}
    </div>
  )
}
