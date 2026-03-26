import { useState, useMemo } from 'react'
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
import { useCoursePhaseEvolution } from '../../hooks/useCoursePhaseEvolution'
import { useCourseDetailsById } from '../../hooks/useCourseDetailsById'
import { useExamEvolution } from '../../hooks/useExamEvolution'
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
  
  const code1 = effectiveCodes[0]
  const code2 = effectiveCodes[1] // Pode ser undefined

  // Carregar dados para o código principal e secundário (se existir), passando o nome do curso
  const { data: data1, predictions: pred1, loading: load1, error: err1, yearRange: range1 } = useCoursePhaseEvolution(code1?.inst, code1?.curso, displayCourseName) // displayCourseName is the 3rd arg
  const { data: data2, predictions: pred2, loading: load2 } = useCoursePhaseEvolution(code2?.inst || '', code2?.curso || '', displayCourseName) // displayCourseName is the 3rd arg

  // Fundir dados dos dois códigos
  const data = useMemo(() => {
    const d1 = data1 || []
    const d2 = (code2 && data2) ? data2 : []
    
    // Combinar e remover duplicados por ano
    const combined = [...d1, ...d2]
    const uniqueMap = new Map()
    // Usar String(year) como chave para garantir que 2020 (number) e "2020" (string) sejam o mesmo ano
    combined.forEach(item => uniqueMap.set(String(item.year), item))
    
    return Array.from(uniqueMap.values()).sort((a, b) => a.year - b.year)
  }, [data1, data2, code2])

  // Usar previsões do código que tem dados mais recentes
  const predictions = useMemo(() => {
    if (!pred1 && !pred2) return null
    if (!pred2) return pred1
    if (!pred1) return pred2
    
    const maxYear1 = data1 && data1.length ? Math.max(...data1.map(d => Number(d.year))) : 0
    const maxYear2 = data2 && data2.length ? Math.max(...data2.map(d => Number(d.year))) : 0
    return maxYear2 > maxYear1 ? pred2 : pred1
  }, [pred1, pred2, data1, data2])

  const loading = load1 || (code2 && load2)
  const error = err1 // Ignorar erro do segundo código se não existir
  
  // Recalcular range de anos
  const yearRange = useMemo(() => {
    if (!data.length) return { min: null, max: null }
    const years = data.map(d => Number(d.year))
    return { min: Math.min(...years), max: Math.max(...years) }
  }, [data])

  const { course, loading: courseLoading, error: courseError } = useCourseDetailsById(codigoInstituicao, codigoCurso)
  const { data: examData, loading: examLoading, error: examError } = useExamEvolution(EVOLUTION_EXAMS)

  // Correção da lógica do banner: predictions é um objeto, não um array.
  // Procuramos a previsão específica para 2026 na Fase 1.
  const pred2026 = predictions?.fase_1?.find(p => p.year === 2026);
  const minPred = pred2026 ? pred2026.ciLow.toFixed(1) : '—';
  const maxPred = pred2026 ? pred2026.ciHigh.toFixed(1) : '—';

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
            <p className={styles.avgLabel}>Média Prevista 2026</p>
            <p className={styles.avgValue}>{minPred} - {maxPred}</p>
            <p className={styles.avgConf}>Intervalo de confiança 95%</p>
          </div>
        </div>

        {/* Main content grid */}
        <div className={styles.grid}>
          {/* Left column */}
          <div className={styles.leftCol}>
            {/* Phase Evolution Chart - New */}
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

            {/* Exam Evolution Chart */}
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

          {/* Right column */}
          <div className={styles.rightCol}>
            {/* Required Exams - Now using real data */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`icon-box icon-box--primary`}>
                  <ChecklistIcon />
                </div>
                <h3 className={styles.cardTitle}>Provas de Ingresso</h3>
              </div>
              <AdmissionCalculator 
                course={course}
                isLoading={courseLoading}
                error={courseError}
              />

              {/* Application Simulator */}
              <div className={styles.simulatorSection}>
                <div className={styles.simulatorCardHeader}>
                  <CalculatorIcon className={styles.simulatorHeaderIcon} />
                  <h3 className={styles.simulatorTitle}>Simulador de Candidatura</h3>
                </div>
                <ApplicationSimulator 
                  data={data}
                  predictions={predictions}
                  courseName={displayCourseName}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
