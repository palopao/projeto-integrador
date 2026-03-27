import { useMemo } from 'react'
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

function predictPhase(values, years, steps = 3) {
  const clean = values
    .map((v, i) => (v != null ? { x: years[i], y: v } : null))
    .filter(Boolean)

  if (clean.length < 2) return null

  const ys = clean.map(p => p.y)

  // -------------------------
  // Média global
  // -------------------------
  const mean =
    ys.reduce((a, b) => a + b, 0) / ys.length

  // -------------------------
  // Exponential smoothing
  // -------------------------
  const alpha = 0.5
  let smoothed = ys[0]

  for (let i = 1; i < ys.length; i++) {
    smoothed = alpha * ys[i] + (1 - alpha) * smoothed
  }

  // -------------------------
  // Erro dos resíduos (melhor para IC)
  // -------------------------
  let residualSum = 0

  for (let i = 1; i < ys.length; i++) {
    const prev = ys[i - 1]
    const predicted = alpha * ys[i] + (1 - alpha) * prev
    residualSum += Math.pow(ys[i] - predicted, 2)
  }

  const residualVariance = residualSum / (ys.length - 1)
  const std = Math.sqrt(residualVariance)

  // -------------------------
  // Previsões (mean reversion)
  // -------------------------
  const predictions = []
  const lastYear = clean[clean.length - 1].x

  for (let i = 1; i <= steps; i++) {
    const year = lastYear + i

    // regressão à média progressiva
    const weightToMean = Math.min(0.15 * i, 0.6)

    const predictedRaw =
      (1 - weightToMean) * smoothed +
      weightToMean * mean

    const predicted = Math.max(0, Math.min(200, predictedRaw))

    // crescimento suave da incerteza
    const growthFactor = 1 + i * 0.15

    // IC mais controlado
    const margin = 1.28 * std * growthFactor

    const ciLow = Math.max(0, predicted - margin)
    const ciHigh = Math.min(200, predicted + margin)

    predictions.push({ year, predicted, ciLow, ciHigh })
  }

  return predictions
}

/**
 * CustomTooltip para o gráfico de evolução de fases
 * Mostra os valores com 1 decimal, exibe "—" para valores nulos
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>Ano: {label}</p>
      {payload.map((entry, idx) => {
        let color = entry.color;

        // Se for a fase_1_low, muda para azul no tooltip
        if (entry.dataKey === 'fase_1_low') {
          color = '#2563eb' // cor da legenda no hover
        }
        if (entry.dataKey === 'fase_2_low') {
          color = '#10b981' // cor da legenda no hover
        }
        if (entry.dataKey === 'fase_3_low') {
          color = '#f59e0b' // cor da legenda no hover
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
  courseName = 'Curso',
  minYear = null,
  maxYear = null,
  isLoading = false,
  error = null,
}) {
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

  const predictions = useMemo(() => {
    if (!data || data.length < 2) return null

    const years = data.map(d => Number(d.year))

    return {
      fase_1: predictPhase(data.map(d => d.fase_1), years),
      fase_2: predictPhase(data.map(d => d.fase_2), years),
      fase_3: predictPhase(data.map(d => d.fase_3), years),
    }
  }, [data])

  // Combina dados históricos com previsões
  const combinedData = useMemo(() => {
    if (!predictions) return data

    const combined = [...data]
    const maxYear = Math.max(...data.map(d => Number(d.year)))

    for (let i = 1; i <= 3; i++) {
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
        <h3 className={styles.title}>Evolução das Notas por Fase</h3>
        {minYear && maxYear && (
          <p className={styles.subtitle}>
            Dados históricos de {minYear} a {maxYear}
            {predictions && ' + Previsões'}
          </p>
        )}
      </div>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={combinedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" tick={{ fontSize: 13, fill: '#4b5563' }} />
            <YAxis domain={yAxisDomain()} tick={{ fontSize: 13, fill: '#4b5563' }} />
            <Tooltip content={<CustomTooltip />} />

            {predictions && (
              <ReferenceLine
                x={maxHistoricalYear + 0.5}
                stroke="#d1d5db"
                strokeDasharray="5 5"
                label={{
                  value: 'Histórico / Previsão',
                  position: 'top',
                  fill: '#6b7280',
                  fontSize: 12,
                }}
              />
            )}

            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
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
                  dot={{ r: 4, fill: '#2563eb' }}
                  isAnimationActive={false}
                  connectNulls
                  name="Fase 1 (Previsão)"
                  connectNullsForData={true}
                  legendType="none"
                />
                <Area
                  type="linear"
                  dataKey="fase_1_high"
                  stroke="none"
                  fill="#2563eb"
                  fillOpacity={0.1}
                  isAnimationActive={false}
                  connectNulls
                  name="Fase 1 (Máximo)"
                  legendType="none"
                />
                <Area
                  type="linear"
                  dataKey="fase_1_low"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  isAnimationActive={false}
                  connectNulls
                  name="Fase 1 (Mínimo)"
                  legendType="none"
                />
                <Line
                  type="linear"
                  dataKey="fase_2_pred"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={{ r: 4, fill: '#10b981' }}
                  isAnimationActive={false}
                  connectNulls
                  legendType="none"
                />
                <Area
                  type="linear"
                  dataKey="fase_2_high"
                  stroke="none"
                  fill="#10b981"
                  fillOpacity={0.1}
                  isAnimationActive={false}
                  connectNulls
                  legendType="none"
                />
                <Area
                  type="linear"
                  dataKey="fase_2_low"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  isAnimationActive={false}
                  connectNulls
                  legendType="none"
                />
                <Line
                  type="linear"
                  dataKey="fase_3_pred"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={{ r: 4, fill: '#f59e0b' }}
                  isAnimationActive={false}
                  connectNulls
                  name="Fase 3 (Previsão)"
                  legendType="none"
                />
                <Area
                  type="linear"
                  dataKey="fase_3_high"
                  stroke="none"
                  fill="#f59e0b"
                  fillOpacity={0.1}
                  isAnimationActive={false}
                  connectNulls
                  legendType="none"
                />
                <Area
                  type="linear"
                  dataKey="fase_3_low"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  isAnimationActive={false}
                  connectNulls
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
