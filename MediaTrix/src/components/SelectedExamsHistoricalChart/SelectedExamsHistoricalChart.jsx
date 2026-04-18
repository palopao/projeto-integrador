import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import styles from './SelectedExamsHistoricalChart.module.css'

// Função para remover acentos e normalizar strings
const normalizeString = (str) => {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+e\s+/g, '_') // Substitui " e " por underscore (ex: "Biologia e Geologia" -> "biologia_geologia")
    .replace(/\s+/g, '_') // Substitui outros espaços por underscores
    .replace(/[&,]/g, '') // Remove & e virgulas
}

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

    const availableExams = [...new Set(historicalData.map(e => e.Exame_Unificado))]
    
    console.log('Selected Exams:', selectedExams)
    console.log('Available Exams:', availableExams)

    // Função para fazer matching entre nomes com normalização de acentos
    const findMatchingExamName = (selectedName) => {
      const normalized = normalizeString(selectedName)
      
      // Debug
      console.log(`  Matching "${selectedName}" → normalized: "${normalized}"`)
      
      // Procura match exacto primeiro (com normalização)
      let match = availableExams.find(exam => {
        const normalizedExam = normalizeString(exam)
        console.log(`    vs "${exam}" → "${normalizedExam}" | match: ${normalizedExam === normalized}`)
        return normalizedExam === normalized
      })
      if (match) {
        console.log(`  ✓ Found exact match: "${match}"`)
        return match
      }
      
      // Se não encontrou, procura parcial removendo sufixos
      const baseNormalized = normalized.replace(/_[abc12]$/, '')
      
      match = availableExams.find(exam => {
        const normalizedExam = normalizeString(exam)
        const baseExam = normalizedExam.replace(/_[abc12]$/, '')
        
        return (
          baseExam === baseNormalized ||
          normalizedExam.includes(normalized) ||
          normalized.includes(normalizedExam) ||
          baseExam.includes(baseNormalized) ||
          baseNormalized.includes(baseExam)
        )
      })
      
      if (match) {
        console.log(`  ✓ Found partial match: "${match}"`)
        return match
      }
      
      console.log(`  ✗ No match found`)
      return null
    }

    // Cria um mapa de exames selecionados para seus correspondentes no histórico
    const examMapping = {}
    selectedExams.forEach(exam => {
      const matchedName = findMatchingExamName(exam.name)
      if (matchedName) {
        examMapping[matchedName] = exam.name
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
