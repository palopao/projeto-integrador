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

export default function CourseDetail({ codigoInstituicao = '150', codigoCurso = '9219', nomeDefault = 'Psicologia - Universidade dos Açores - Faculdade de Ciências Sociais e Humanas', codes }) {
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

  // Carregar dados para o código principal e secundário (se existir)
  const { data: data1, predictions: pred1, loading: load1, error: err1, yearRange: range1 } = useCoursePhaseEvolution(code1?.inst, code1?.curso)
  const { data: data2, predictions: pred2, loading: load2 } = useCoursePhaseEvolution(code2?.inst || '', code2?.curso || '')

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
  const { data: examData, loading: examLoading, error: examError } = useExamEvolution(['Biologia', 'Fisica'])

  // Extract course name and institution from nomeDefault  
  // Format: "Course Name - Institution Name"
  const parseCourseInfo = (courseFullName) => {
    if (!courseFullName) return { institution: '', courseName: '' }
    // Format esperado: "Psicologia - Universidade dos Açores - Faculdade de ..."
    // Pega o primeiro ou segundo - como nome do curso e o resto como instituição
    const parts = courseFullName.split(' - ')
    if (parts.length === 1) {
      return { institution: '', courseName: parts[0] || '' }
    }
    // Primeira parte é o nome do curso, resto é instituição
    return {
      courseName: parts[0] || '',
      institution: parts.slice(1).join(' - ') || ''
    }
  }

  // Usar nomeDefault se disponível, senão usar dados de course
  const displayInfo = nomeDefault ? parseCourseInfo(nomeDefault) : null
  const displayCourseName = displayInfo?.courseName || 'Curso'
  const displayInstitution = displayInfo?.institution || 'Universidade'

  // Calculate average prediction for banner
  const avgPrediction = predictions && predictions.length > 0 
    ? predictions[predictions.length - 1]
    : null
  const minPred = avgPrediction ? (avgPrediction.prediction - (avgPrediction.ciHigh - avgPrediction.prediction)).toFixed(1) : '—'
  const maxPred = avgPrediction ? (avgPrediction.prediction + (avgPrediction.ciHigh - avgPrediction.prediction)).toFixed(1) : '—'

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
                  examNames={['Biologia', 'Fisica']}
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
