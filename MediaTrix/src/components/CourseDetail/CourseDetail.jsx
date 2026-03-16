import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
  Legend, BarChart, Bar
} from 'recharts'
import ChartLineIcon from '../../assets/icons/chart-line.svg?react'
import TrendUpIcon from '../../assets/icons/trend-up.svg?react'
import DatabaseIcon from '../../assets/icons/database.svg?react'
import ArrowUpIcon from '../../assets/icons/arrow-up.svg?react'
import ChecklistIcon from '../../assets/icons/checklist.svg?react'
import CalculatorIcon from '../../assets/icons/calculator.svg?react'
import styles from './CourseDetail.module.css'

/* Mock data for the grade evolution chart */
const gradeEvolution = [
  { year: '2020', real: 18.2, predicted: null, ciLow: null, ciHigh: null },
  { year: '2021', real: 18.5, predicted: null, ciLow: null, ciHigh: null },
  { year: '2022', real: 18.4, predicted: null, ciLow: null, ciHigh: null },
  { year: '2023', real: 18.7, predicted: null, ciLow: null, ciHigh: null },
  { year: '2024', real: 18.8, predicted: 18.9, ciLow: 18.5, ciHigh: 19.3 },
  { year: '2025', real: null, predicted: 19.0, ciLow: 18.6, ciHigh: 19.4 },
  { year: '2026', real: null, predicted: 19.0, ciLow: 18.8, ciHigh: 19.2 },
]

/* Mock data for exam score evolution */
const examEvolution = [
  { year: '2020', biologia: 12.5, fisica: 11.8 },
  { year: '2021', biologia: 13.0, fisica: 12.2 },
  { year: '2022', biologia: 12.8, fisica: 12.0 },
  { year: '2023', biologia: 13.2, fisica: 12.4 },
  { year: '2024', biologia: 13.8, fisica: 12.4 },
]

const exams = [
  {
    name: 'Nota Interna',
    weight: '30%',
    minScore: 'Nota mínima: 95 pontos',
    optional: null,
  },
  {
    name: 'Biologia e Geologia',
    weight: '35%',
    minScore: 'Nota mínima: 95 pontos',
    optional: null,
  },
  {
    name: 'Física e Química A',
    weight: '35%',
    minScore: 'Nota mínima: 95 pontos',
    optional: {
      name: 'Matemática A',
      label: 'Opcional',
      desc: 'Pode substituir FQ',
    },
  },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className={styles.tooltipValue}>
          {p.name}: {p.value?.toFixed(1) ?? '—'}
        </p>
      ))}
    </div>
  )
}

function Simulator() {
  const [notaInterna, setNotaInterna] = useState('')
  const [biologia, setBiologia] = useState('')
  const [fisica, setFisica] = useState('')
  const [result, setResult] = useState(null)

  const calcular = () => {
    const ni = parseFloat(notaInterna) || 0
    const bio = parseFloat(biologia) || 0
    const fis = parseFloat(fisica) || 0
    const media = (ni * 0.30 + bio * 0.35 + fis * 0.35) / 10
    setResult(media.toFixed(1))
  }

  const getProbabilidade = (media) => {
    if (media >= 19.0) return { text: 'Probabilidade Alta', color: '#10b981' }
    if (media >= 18.5) return { text: 'Probabilidade Média', color: '#10b981' }
    if (media >= 18.0) return { text: 'Probabilidade Baixa', color: '#f59e0b' }
    return { text: 'Probabilidade Muito Baixa', color: '#ef4444' }
  }

  return (
    <div className={styles.simulator}>
      <div className={styles.simulatorHeader}>
        <CalculatorIcon className={styles.simulatorHeaderIcon} />
        <h3 className={styles.simulatorTitle}>Simulador de Candidatura</h3>
      </div>

      <div className={styles.simulatorForm}>
        <label className={styles.simulatorLabel}>Nota Interna (0-200)</label>
        <input
          type="number"
          min="0"
          max="200"
          placeholder="Ex: 180"
          value={notaInterna}
          onChange={(e) => setNotaInterna(e.target.value)}
          className={styles.simulatorInput}
        />

        <label className={styles.simulatorLabel}>Biologia e Geologia (0-200)</label>
        <input
          type="number"
          min="0"
          max="200"
          placeholder="Ex: 175"
          value={biologia}
          onChange={(e) => setBiologia(e.target.value)}
          className={styles.simulatorInput}
        />

        <label className={styles.simulatorLabel}>Física e Química A (0-200)</label>
        <input
          type="number"
          min="0"
          max="200"
          placeholder="Ex: 170"
          value={fisica}
          onChange={(e) => setFisica(e.target.value)}
          className={styles.simulatorInput}
        />

        <button type="button" className={styles.calcBtn} onClick={calcular}>
          Calcular Média
        </button>

        {result && (
          <div className={styles.resultBox}>
            <p className={styles.resultLabel}>Média Estimada</p>
            <p className={styles.resultValue}>{result}</p>
            <div className={styles.resultProb}>
              <span
                className={styles.resultDot}
                style={{ background: getProbabilidade(parseFloat(result)).color }}
              />
              <span className={styles.resultProbText}>
                {getProbabilidade(parseFloat(result)).text}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CourseDetail() {
  return (
    <section className={styles.section}>
      <div className="container">
        {/* University Info Banner */}
        <div className={styles.banner}>
          <div className={styles.bannerLeft}>
            <p className={styles.university}>Universidade de Lisboa</p>
            <h2 className={styles.courseName}>Medicina</h2>
            <div className={styles.tags}>
              <span>Lisboa</span>
              <span>Pública</span>
              <span>240 Vagas</span>
            </div>
          </div>
          <div className={styles.bannerRight}>
            <p className={styles.avgLabel}>Média Prevista 2026</p>
            <p className={styles.avgValue}>18.8 - 19.2</p>
            <p className={styles.avgConf}>Intervalo de confiança 95%</p>
          </div>
        </div>

        {/* Main content grid */}
        <div className={styles.grid}>
          {/* Left column */}
          <div className={styles.leftCol}>
            {/* Grade Evolution Chart */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`icon-box icon-box--primary`}>
                  <ChartLineIcon />
                </div>
                <h3 className={styles.cardTitle}>Evolução das Médias de Acesso</h3>
              </div>
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={gradeEvolution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" tick={{ fontSize: 13, fill: '#4b5563' }} />
                    <YAxis domain={[17, 20]} tick={{ fontSize: 13, fill: '#4b5563' }} allowDataOverflow />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="ciHigh"
                      stackId="ci"
                      stroke="none"
                      fill="rgba(16, 185, 129, 0.15)"
                      connectNulls={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="ciLow"
                      stackId="ci"
                      stroke="none"
                      fill="#f8fafc"
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="real"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#2563eb' }}
                      connectNulls={false}
                      name="Média Real"
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#10b981"
                      strokeWidth={3}
                      strokeDasharray="6 4"
                      dot={{ r: 5, fill: '#10b981' }}
                      connectNulls={false}
                      name="Previsão"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#2563eb' }} />
                  Média Real
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#10b981' }} />
                  Previsão 2024
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: 'rgba(16, 185, 129, 0.30)' }} />
                  Intervalo de Confiança
                </span>
              </div>
              <div className={styles.trendBox}>
                <TrendUpIcon className={styles.trendIcon} />
                <div>
                  <p className={styles.trendTitle}>Tendência: Estável</p>
                  <p className={styles.trendDesc}>
                    A média de acesso mantém-se estável nos últimos 3 anos, com ligeira subida prevista.
                  </p>
                </div>
              </div>
            </div>

            {/* Exam Scores Chart */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`icon-box icon-box--primary`}>
                  <DatabaseIcon />
                </div>
                <h3 className={styles.cardTitle}>Evolução das Notas dos Exames</h3>
              </div>
              <div className={styles.examSubjects}>
                <div className={styles.examSubject}>
                  <span className={styles.examName}>Biologia e Geologia</span>
                  <span className={styles.examWeight}>Peso: 35%</span>
                </div>
                <div className={styles.examSubject}>
                  <span className={styles.examName}>Física e Química A</span>
                  <span className={styles.examWeight}>Peso: 35%</span>
                </div>
              </div>
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={examEvolution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" tick={{ fontSize: 13, fill: '#4b5563' }} />
                    <YAxis domain={[8, 16]} tick={{ fontSize: 13, fill: '#4b5563' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="biologia" name="Biologia e Geologia" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fisica" name="Física e Química A" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.examTrends}>
                <div className={styles.examTrendGreen}>
                  <ArrowUpIcon className={styles.examTrendIcon} />
                  <span className={styles.examTrendBold}>Subida de 0.8 valores</span>
                  <span className={styles.examTrendLight}>em relação ao ano anterior</span>
                </div>
                <div className={styles.examTrendYellow}>
                  <span className={styles.examTrendLine}>—</span>
                  <span className={styles.examTrendBold}>Estável</span>
                  <span className={styles.examTrendLight}>sem variação significativa</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className={styles.rightCol}>
            {/* Required Exams */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`icon-box icon-box--primary`}>
                  <ChecklistIcon />
                </div>
                <h3 className={styles.cardTitle}>Exames Obrigatórios</h3>
              </div>
              <div className={styles.examsList}>
                {exams.map((exam, i) => (
                  <div key={i} className={styles.examCard}>
                    <div className={styles.examCardTop}>
                      <span className={styles.examCardName}>{exam.name}</span>
                      <span className={styles.examCardWeight}>{exam.weight}</span>
                    </div>
                    <p className={styles.examCardMin}>{exam.minScore}</p>
                    {exam.optional && (
                      <div className={styles.optionalCard}>
                        <div className={styles.examCardTop}>
                          <span className={styles.examCardName}>{exam.optional.name}</span>
                          <span className={styles.optionalLabel}>{exam.optional.label}</span>
                        </div>
                        <p className={styles.examCardMin}>{exam.optional.desc}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Simulator */}
              <Simulator />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
