import { useState, useMemo, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts'
import ChartLineIcon from '../../assets/icons/chart-line.svg?react'
import ChecklistIcon from '../../assets/icons/checklist.svg?react'
import CalculatorIcon from '../../assets/icons/calculator.svg?react'
import CoursePhaseEvolutionChart from '../CoursePhaseEvolutionChart/CoursePhaseEvolutionChart'
import AdmissionCalculator from '../AdmissionCalculator/AdmissionCalculator'
import ApplicationSimulator from '../ApplicationSimulator/ApplicationSimulator'
import ExamEvolutionChart from '../ExamEvolutionChart/ExamEvolutionChart'
import SelectedExamsHistoricalChart from '../SelectedExamsHistoricalChart/SelectedExamsHistoricalChart'
import { useCoursePhaseEvolution } from '../../hooks/useCoursePhaseEvolution'
import { useCourseDetailsById } from '../../hooks/useCourseDetailsById'
import { useExamEvolution } from '../../hooks/useExamEvolution'
import { useExamHistoricalData } from '../../hooks/useExamHistoricalData'
import styles from './CourseDetail.module.css'

// Função auxiliar movida para fora para evitar re-declarações e permitir uso imediato
const parseCourseInfo = (courseFullName) => {
  if (!courseFullName) return { institution: '', courseName: '' }
  const parts = courseFullName.split(' - ')
  if (parts.length === 1) {
    return { institution: '', courseName: parts[0] || '' }
  }
  return {
    courseName: parts[0] || '',
    institution: parts.slice(1).join(' - ') || ''
  }
}

// Constantes fora do componente para manter referências estáveis e evitar loops
const EVOLUTION_EXAMS = ['Biologia', 'Fisica'];

export default function CourseDetail({ codigoInstituicao = '150', codigoCurso = '9219', nomeDefault = 'Psicologia - Universidade dos Açores - Faculdade de Ciências Sociais e Humanas', codes }) {
  // 1. Calcular a informação do curso IMEDIATAMENTE no início para poder ser usada nos hooks abaixo
  const displayInfo = useMemo(() => parseCourseInfo(nomeDefault), [nomeDefault])
  const displayCourseName = displayInfo?.courseName || 'Curso'
  const displayInstitution = displayInfo?.institution || 'Universidade'

  const [selectedExamSetIdx, setSelectedExamSetIdx] = useState(0)
  const [selectedExams, setSelectedExams] = useState([])

  // Resetar a seleção de exames sempre que o curso mudar
  useEffect(() => {
    setSelectedExamSetIdx(0)
    setSelectedExams([])
  }, [displayCourseName, displayInstitution])

  const degreeChangeInfo = useMemo(() => {
    if (!codes || codes.length < 2) return null

    const graus = new Set(codes.map(c => c.grau))
    // Deteta a transição específica de Mestrado Integrado para Licenciatura
    if (graus.has('MI') && graus.has('L1')) {
      return {
        year: 2021, // O ano da transição do Processo de Bolonha
      }
    }
    return null
  }, [codes])

  // Gerir múltiplos códigos (histórico vs atual)
  const effectiveCodes = codes && codes.length > 0
    ? codes
    : [{ inst: codigoInstituicao, curso: codigoCurso }]

  // Carregar dados para o código principal e secundário (se existir), passando o nome do curso
  const { 
    data = [], 
    predictions, 
    loading, 
    error, 
    yearRange 
  } = useCoursePhaseEvolution(displayCourseName, displayInstitution)

  const { 
    course, 
    loading: courseLoading, 
    error: courseError 
  } = useCourseDetailsById(displayCourseName, displayInstitution)
  
  const { data: examData, loading: examLoading, error: examError } = useExamEvolution(EVOLUTION_EXAMS)
  
  const { data: historicalExamData, loading: historicalExamLoading } = useExamHistoricalData()

  // Correção da lógica do banner: predictions é um objeto, não um array.
  // Procuramos a previsão específica para 2025 na Fase 1.
  const predmin = predictions?.fase_1[0]?.ciLow.toFixed(1);
  const predmax = predictions?.fase_1[0]?.ciHigh.toFixed(1);
  const minPred = predmin ? predmin: '—';
  const maxPred = predmax ? predmax: '—';

  return (
    <section className={styles.section}>
      {degreeChangeInfo && (
        <div className={styles.degreeNotice}>
          <div className="container">
            <p>ℹ️ <b>Aviso:</b> O grau deste curso mudou de Mestrado Integrado para Licenciatura em {degreeChangeInfo.year}. Os dados apresentados foram agregados para refletir a continuidade histórica do curso.</p>
          </div>
        </div>
      )}
      <div className="container">
        {/* University Info Banner */}
        <div className={styles.banner}>
          <div className={styles.bannerLeft}>
            <p className={styles.university}>{displayInstitution}</p>
            <h2 className={styles.courseName}>{displayCourseName}</h2>
            <div className={styles.tags}>
              <span>{codigoInstituicao}</span>
              <span>{codigoCurso}</span>
              {course?.formula_nota && <span>Com Fórmula</span>}
            </div>
          </div>
          <div className={styles.bannerRight}>
            <p className={styles.avgLabel}>Média Prevista 2025</p>
            <p className={styles.avgValue}>{minPred} - {maxPred}</p>
            <p className={styles.avgConf}>Intervalo de confiança 95%</p>
          </div>
        </div>

        {/* Main content grid */}
        <div className={styles.grid}>
          {/* Left column - Phase Evolution Chart */}
          <div className={styles.card}>
            <CoursePhaseEvolutionChart
              data={data}
              predictions={predictions}
              courseName={displayCourseName}
              minYear={yearRange.min}
              maxYear={yearRange.max}
              isLoading={loading}
              error={error}
            />
          </div>

          {/* Right column - Selected Exams Historical Chart */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={`icon-box icon-box--primary`}>
                <ChartLineIcon />
              </div>
              <h3 className={styles.cardTitle}>Histórico dos Exames de Ingresso</h3>
            </div>
            <SelectedExamsHistoricalChart
              selectedExams={selectedExams}
              historicalData={historicalExamData}
              isLoading={historicalExamLoading}
            />
          </div>
        </div>

        {/* Secondary content grid */}
        <div className={styles.secondaryGrid}>
          {/* Exam Evolution Chart - Full width */}
          {examData && examData.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`icon-box icon-box--primary`}>
                  <ChartLineIcon />
                </div>
                <h3 className={styles.cardTitle}>Evolução das Notas dos Exames</h3>
              </div>
              <ExamEvolutionChart
                data={examData}
                isLoading={examLoading}
                error={examError}
                examNames={EVOLUTION_EXAMS}
              />
            </div>
          )}
        </div>

        {/* Tertiary content grid */}
        <div className={styles.tertiaryGrid}>
          {/* Required Exams - Now using real data */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={`icon-box icon-box--primary`}>
                <ChecklistIcon />
              </div>
              <h3 className={styles.cardTitle}>Provas de Ingresso</h3>
            </div>
            <AdmissionCalculator
              courseName={displayCourseName}
              institutionName={displayInstitution}
              selectedIdx={selectedExamSetIdx}
              onSelect={setSelectedExamSetIdx}
              onSelectedExamsChange={setSelectedExams}
            />
          </div>

          {/* Application Simulator */}
          <div className={styles.card}>
            <div className={styles.simulatorCardHeader}>
              <CalculatorIcon className={styles.simulatorHeaderIcon} />
              <h3 className={styles.simulatorTitle}>Simulador de Candidatura</h3>
            </div>
            <ApplicationSimulator
              data={data}
              predictions={predictions}
              courseName={displayCourseName}
              course={course}
              selectedExamSetIdx={selectedExamSetIdx}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
