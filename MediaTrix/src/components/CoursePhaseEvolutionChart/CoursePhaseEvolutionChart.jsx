import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'
import styles from './CoursePhaseEvolutionChart.module.css'

/**
 * CustomTooltip para o gráfico de evolução de fases
 * Mostra os valores com 1 decimal, exibe "—" para valores nulos
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>Ano: {label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} style={{ color: entry.color }} className={styles.tooltipValue}>
          {entry.name}: {entry.value !== null ? entry.value.toFixed(1) : '—'}
        </p>
      ))}
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
  // Calcula estatísticas dos dados históricos
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null

    const validFase1 = data.filter((d) => d.fase_1 !== null).map((d) => d.fase_1)
    const validFase2 = data.filter((d) => d.fase_2 !== null).map((d) => d.fase_2)
    const validFase3 = data.filter((d) => d.fase_3 !== null).map((d) => d.fase_3)

    const avgFase1 =
      validFase1.length > 0 ? validFase1.reduce((a, b) => a + b) / validFase1.length : null
    const avgFase2 =
      validFase2.length > 0 ? validFase2.reduce((a, b) => a + b) / validFase2.length : null
    const avgFase3 =
      validFase3.length > 0 ? validFase3.reduce((a, b) => a + b) / validFase3.length : null

    return { avgFase1, avgFase2, avgFase3 }
  }, [data])

  // Combina dados históricos com previsões
  const combinedData = useMemo(() => {
    if (!predictions) return data

    const combined = [...data]
    const maxYear = Math.max(...data.map((d) => Number(d.year)))

    for (let i = 1; i <= 3; i++) {
      const year = maxYear + i
      let entry = combined.find((d) => Number(d.year) === year)

      if (!entry) {
        entry = { year }
        combined.push(entry)
      }

      if (predictions.fase_1 && predictions.fase_1[i - 1]) {
        entry.fase_1_pred = predictions.fase_1[i - 1].predicted
        entry.fase_1_ciLow = predictions.fase_1[i - 1].ciLow
        entry.fase_1_ciHigh = predictions.fase_1[i - 1].ciHigh
      }

      if (predictions.fase_2 && predictions.fase_2[i - 1]) {
        entry.fase_2_pred = predictions.fase_2[i - 1].predicted
        entry.fase_2_ciLow = predictions.fase_2[i - 1].ciLow
        entry.fase_2_ciHigh = predictions.fase_2[i - 1].ciHigh
      }

      if (predictions.fase_3 && predictions.fase_3[i - 1]) {
        entry.fase_3_pred = predictions.fase_3[i - 1].predicted
        entry.fase_3_ciLow = predictions.fase_3[i - 1].ciLow
        entry.fase_3_ciHigh = predictions.fase_3[i - 1].ciHigh
      }
    }

    return combined.sort((a, b) => Number(a.year) - Number(b.year))
  }, [data, predictions])

  const yAxisDomain = () => {
    const allValues = combinedData
      .flatMap((d) => [
        d.fase_1,
        d.fase_2,
        d.fase_3,
        d.fase_1_pred,
        d.fase_2_pred,
        d.fase_3_pred,
      ])
      .filter((v) => v !== null && v !== undefined)

    if (allValues.length === 0) return [0, 200]

    const min = Math.min(...allValues)
    const max = Math.max(...allValues)
    const padding = (max - min) * 0.1

    return [Math.floor(min - padding), Math.ceil(max + padding)]
  }

  if (isLoading && (!data || data.length === 0)) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Carregando dados...</p>
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
          <LineChart data={combinedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
              name="Fase 1 (Histórico)"
            />
            <Line
              type="linear"
              dataKey="fase_2"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 5, fill: '#10b981' }}
              isAnimationActive={false}
              connectNulls
              name="Fase 2 (Histórico)"
            />
            <Line
              type="linear"
              dataKey="fase_3"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 5, fill: '#f59e0b' }}
              isAnimationActive={false}
              connectNulls
              name="Fase 3 (Histórico)"
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
                  name="Fase 2 (Previsão)"
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
                />
              </>
            )}
          </LineChart>
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
