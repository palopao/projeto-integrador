import { useMemo, useState, useEffect } from 'react'
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
      {showExpandButton && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
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
              transition: 'all 0.2s'
            }}
          >
            {isExpanded ? '✕ Reduzir' : '↔️ Expandir'}
          </button>
        </div>
      )}

      <div className={styles.chartWrap} style={{ 
        overflowX: isExpanded ? 'auto' : 'hidden', 
        WebkitOverflowScrolling: 'touch' 
      }}>
        <ResponsiveContainer width="100%" height={340} minWidth={isExpanded ? 470 : undefined}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 10, fill: '#4b5563' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 20]}
              tick={{ fontSize: 10, fill: '#4b5563' }}
              allowDataOverflow={false}
            />
            <Tooltip content={<CustomTooltip />} />
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

    </div>
  )
}
