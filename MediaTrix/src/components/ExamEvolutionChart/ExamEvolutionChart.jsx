import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'
import styles from './ExamEvolutionChart.module.css'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className={styles.tooltipValue}>
          {p.name}: {p.value?.toFixed(2) ?? '—'}
        </p>
      ))}
    </div>
  )
}

export default function ExamEvolutionChart({ data, isLoading, error, examNames = [] }) {
  if (isLoading && (!data || data.length === 0)) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando dados de exames...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Erro ao carregar dados: {error.message}</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Sem dados de evolução de exames disponíveis</div>
      </div>
    )
  }

  // Cores para as linhas (máximo 3 exames)
  const colors = ['#2563eb', '#10b981', '#f59e0b']
  const examsToShow = examNames.slice(0, 3)

  return (
    <div className={styles.container}>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 13, fill: '#4b5563' }}
            />
            <YAxis
              domain={[8, 20]}
              tick={{ fontSize: 13, fill: '#4b5563' }}
              allowDataOverflow={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingBottom: '16px' }}
              tooltipType="none"
            />

            {/* Linhas para cada exame */}
            {examsToShow.map((examName, index) => (
              <Line
                key={examName}
                type="linear"
                dataKey={examName}
                stroke={colors[index]}
                strokeWidth={3}
                dot={{ r: 5, fill: colors[index] }}
                isAnimationActive={false}
                connectNulls={true}
                name={examName}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {examsToShow.map((examName, index) => {
          const validValues = data
            .filter((d) => d[examName] !== null && d[examName] !== undefined)
            .map((d) => d[examName])

          if (validValues.length === 0) return null

          const min = Math.min(...validValues)
          const max = Math.max(...validValues)
          const avg = validValues.reduce((a, b) => a + b) / validValues.length
          const latest = validValues[validValues.length - 1]
          const trend = 
            validValues.length >= 2 
              ? validValues[validValues.length - 1] - validValues[validValues.length - 2]
              : 0

          return (
            <div key={examName} className={styles.statCard}>
              <div className={styles.statColorBox} style={{ borderLeftColor: colors[index] }} />
              <div className={styles.statContent}>
                <p className={styles.statTitle}>{examName}</p>
                <p className={styles.statValue}>{latest.toFixed(2)}</p>
                <div className={styles.statMeta}>
                  <span>Mín: {min.toFixed(2)}</span>
                  <span>Máx: {max.toFixed(2)}</span>
                  <span>Méd: {avg.toFixed(2)}</span>
                </div>
                {trend !== 0 && (
                  <p className={styles.statTrend} style={{
                    color: trend > 0 ? '#10b981' : '#ef4444'
                  }}>
                    {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(2)} últimos 2 anos
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Info box */}
      <div className={styles.infoBox}>
        <p className={styles.infoTitle}>📊 Sobre Este Gráfico</p>
        <p className={styles.infoText}>
          Mostra a evolução das notas médias em escala 0-20 para os exames aceites neste curso.
          As flutuações refletem mudanças na dificuldade ou preparação dos candidatos ao longo dos anos.
        </p>
      </div>
    </div>
  )
}
