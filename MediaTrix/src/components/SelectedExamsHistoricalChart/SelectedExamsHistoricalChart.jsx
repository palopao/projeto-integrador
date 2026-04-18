import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import styles from './SelectedExamsHistoricalChart.module.css'

// Mapeamento fixo entre cursos_detalhes e medias_historicas_exames
const EXAM_CODE_MAPPING = {
  '01': 'Alemao',
  '02': 'Biologia_Geologia',
  '03': 'Desenho_A',
  '04': 'Economia_A',
  '05': 'Espanhol_Continuacao',
  '06': 'Filosofia',
  '07': 'Fisica_Quimica_A',
  '08': 'Frances',
  '09': 'Geografia_A',
  '10': 'Geometria_Descritiva_A',
  '11': 'Historia_A',
  '12': 'HCA',
  '13': 'Ingles',
  '14': 'Latim_A',
  '15': 'Literatura_Portuguesa',
  '16': 'Matematica_B',
  '17': 'MACS',
  '18': 'Portugues',
  '19': 'Matematica_A',
  '20': 'Mandarim_Iniciacao',
  '21': 'Italiano_Iniciacao'
};

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

export default function SelectedExamsHistoricalChart({ selectedExams, historicalData, isLoading }) {
  // Processas dados históricos para o gráfico
  const chartData = useMemo(() => {
    if (!historicalData || !selectedExams || selectedExams.length === 0) {
      return []
    }

    // Cria um mapa de exames selecionados para seus correspondentes no histórico
    const examMapping = {}
    selectedExams.forEach(exam => {
      // Procura o identificador unificado usando o código do exame (ex: '02' -> 'Biologia_Geologia')
      const matchedUnifiedName = EXAM_CODE_MAPPING[exam.code]
      if (matchedUnifiedName) {
        examMapping[matchedUnifiedName] = exam.name
      }
    })

    // Agrupa dados por ano e exame
    const dataByYear = {}
    
    historicalData.forEach(entry => {
      if (examMapping[entry.Exame_Unificado] && entry.Fase === 1) {
        if (!dataByYear[entry.Ano]) {
          dataByYear[entry.Ano] = { year: entry.Ano }
        }
        // Usar o nome original do exame selecionado como chave
        const displayName = examMapping[entry.Exame_Unificado]
        dataByYear[entry.Ano][displayName] = entry.Media_0_20
      }
    })

    // Converte para array e ordena por ano
    return Object.values(dataByYear).sort((a, b) => a.year - b.year)
  }, [historicalData, selectedExams])

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando dados históricos...</div>
      </div>
    )
  }

  if (!selectedExams || selectedExams.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Selecione exames para visualizar histórico</div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Sem dados históricos disponíveis para os exames selecionados</div>
      </div>
    )
  }

  // Cores para as linhas (máximo 5 exames)
  const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  const examsToShow = selectedExams.slice(0, 5)

  return (
    <div className={styles.container}>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 13, fill: '#4b5563' }}
            />
            <YAxis
              domain={[0, 20]}
              tick={{ fontSize: 13, fill: '#4b5563' }}
              allowDataOverflow={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingBottom: '16px' }}
              tooltipType="none"
            />

            {/* Linhas para cada exame selecionado */}
            {examsToShow.map((exam, index) => (
              <Line
                key={exam.name}
                type="linear"
                dataKey={exam.name}
                stroke={colors[index]}
                strokeWidth={3}
                dot={{ r: 5, fill: colors[index] }}
                isAnimationActive={false}
                connectNulls={true}
                name={exam.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {examsToShow.map((exam, index) => {
          const validValues = chartData
            .map(d => d[exam.name])
            .filter(v => v !== null && v !== undefined)

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
            <div key={exam.name} className={styles.statCard}>
              <div className={styles.statColorBox} style={{ borderLeftColor: colors[index] }} />
              <div className={styles.statContent}>
                <p className={styles.statTitle}>{exam.name}</p>
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
          Mostra o histórico de notas médias (escala 0-20) dos exames de ingresso selecionados.
          Útil para comparar o desempenho ao longo dos anos.
        </p>
      </div>
    </div>
  )
}
