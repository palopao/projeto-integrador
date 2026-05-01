import { useState, useMemo, useEffect } from 'react'
import styles from './ApplicationSimulator.module.css'

// Função mágica para extrair as percentagens da fórmula da DGES
// Ex: "Média do secundário: 60% | Provas de ingresso: 40%" -> { sec: 60, pi: 40 }
const getPesos = (formula) => {
  if (!formula) return { sec: 50, pi: 50 } // Se não houver fórmula, assume 50/50

  const regexSec = /secundário[^\d]*(\d+)%/i
  const regexPi = /ingresso[^\d]*(\d+)%/i
  
  const matchSec = formula.match(regexSec)
  const matchPi = formula.match(regexPi)
  
  const pesoSec = matchSec ? parseInt(matchSec[1]) : 50
  const pesoPi = matchPi ? parseInt(matchPi[1]) : 50
  
  return { sec: pesoSec, pi: pesoPi }
}

export default function ApplicationSimulator({ data, predictions, courseName, course, selectedExamSetIdx = 0 }) {
  const [notaInterna, setNotaInterna] = useState('')
  const [notasExames, setNotasExames] = useState([])
  const [calcResult, setCalcResult] = useState(null)

  // Obter o conjunto de exames selecionado no AdmissionCalculator para personalizar o rótulo
  const selectedSet = useMemo(() => {
    const conjuntos = course?.provas_ingresso || []
    return conjuntos[selectedExamSetIdx] || []
  }, [course, selectedExamSetIdx])

  // Chave única para persistência no localStorage
  const storageKey = useMemo(() => 
    `sim_vals_${courseName}_${course?.instituicao}`, 
    [courseName, course?.instituicao]
  )

  // Carregar dados e sincronizar inputs com o conjunto de exames
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const { ni, exams } = JSON.parse(saved)
      setNotaInterna(ni || '')
      // Apenas restaura exames se a quantidade for a mesma do conjunto atual
      if (exams && exams.length === selectedSet.length) {
        setNotasExames(exams)
        return
      }
    }
    setNotasExames(new Array(selectedSet.length).fill(''))
  }, [selectedSet, storageKey])

  // Guardar dados sempre que mudarem
  useEffect(() => {
    if (notaInterna || notasExames.some(v => v !== '')) {
      localStorage.setItem(storageKey, JSON.stringify({ ni: notaInterna, exams: notasExames }))
    }
  }, [notaInterna, notasExames, storageKey])

  // Extrair os pesos reais do curso atual
  const pesos = useMemo(() => getPesos(course?.formula_nota), [course?.formula_nota])

  // Obter a última nota de cada fase (2024 - último ano)
  const lastYearGrades = useMemo(() => {
    if (!data || data.length === 0) return null
    const lastEntry = data[data.length - 1]
    return {
      fase1: lastEntry.fase_1,
      fase2: lastEntry.fase_2,
      fase3: lastEntry.fase_3,
      year: lastEntry.year,
    }
  }, [data])

  // Obter a previsão para o próximo ano
  const nextYearPrediction = useMemo(() => {
    if (!predictions) return null
    const year = predictions.fase_1?.[0]?.year || predictions.fase_2?.[0]?.year || predictions.fase_3?.[0]?.year
    if (!year) return null

    return {
      year,
      fase1: predictions.fase_1?.[0],
      fase2: predictions.fase_2?.[0],
      fase3: predictions.fase_3?.[0],
    }
  }, [predictions])

  const handleExamChange = (index, value) => {
    const newNotas = [...notasExames]
    newNotas[index] = value
    setNotasExames(newNotas)
  }

  // O nosso novo cálculo matemático dinâmico!
  const calcular = () => {
    const ni = parseFloat(notaInterna) || 0
    const piValues = notasExames.map(v => parseFloat(v) || 0)
    
    // Verifica se existem pesos individuais nas provas (ex: 15%, 25%)
    const hasIndividualWeights = selectedSet.some(p => p.weight !== undefined)

    if (hasIndividualWeights) {
      // Cálculo Ponderado Individual (Soma de cada nota * seu peso específico)
      // Nota: Nestes casos, a soma dos pesos das PIs no JSON já corresponde ao total da fórmula (ex: 15+15+25 = 55%)
      const piWeightedSum = selectedSet.reduce((acc, prova, idx) => {
        const weight = prova.weight || (pesos.pi / selectedSet.length)
        return acc + (piValues[idx] * (weight / 100))
      }, 0)

      const mediaFinal = (ni * (pesos.sec / 100) + piWeightedSum) / 10
      setCalcResult(mediaFinal.toFixed(2))
    } else {
      // Cálculo por Média Aritmética (Média das PIs * peso total do grupo)
      const piMedia = piValues.length > 0 ? piValues.reduce((a, b) => a + b, 0) / piValues.length : 0
      const mediaFinal = (ni * (pesos.sec / 100) + piMedia * (pesos.pi / 100)) / 10
      setCalcResult(mediaFinal.toFixed(2))
    }
  }

  // Helper para calcular probabilidade para uma nota específica
  const evaluateProbability = (userGrade, targetGrade) => {
    if (targetGrade === null || targetGrade === undefined) return null;

    const diff = userGrade - (targetGrade / 10);

    let probability = 'Muito Baixa'
    let color = '#ef4444'
    let icon = '❌'
    let recommendation = 'Nota abaixo dos registos recentes'

    if (diff >= 1.0) {
      probability = 'Muito Alta'
      color = '#059669'
      icon = '✅'
      recommendation = 'Nota bastante acima dos registos, entrada muito provável'
    } else if (diff >= 0.5) {
      probability = 'Alta'
      color = '#10b981'
      icon = '✅'
      recommendation = 'Nota acima dos registos, boa probabilidade de entrada'
    } else if (diff >= -0.2) {
      probability = 'Média'
      color = '#f59e0b'
      icon = '⚠️'
      recommendation = 'Nota próxima aos registos, entrada possível'
    } else if (diff >= -0.5) {
      probability = 'Baixa'
      color = '#f59e0b'
      icon = '⚠️'
      recommendation = 'Nota ligeiramente abaixo dos registos'
    }

    return { probability, color, icon, recommendation, diff };
  }

  // Determinar a probabilidade para cada fase
  const phaseProbabilities = useMemo(() => {
    if (!calcResult) return []

    const userGrade = parseFloat(calcResult)

    const targets = [
      { 
        id: 'f1', 
        label: nextYearPrediction?.year ? `1ª Fase ${nextYearPrediction.year} (Previsto)` : `1ª Fase ${lastYearGrades?.year || ''}`,
        grade: nextYearPrediction?.fase1?.predicted ?? lastYearGrades?.fase1 
      },
      { 
        id: 'f2', 
        label: nextYearPrediction?.year ? `2ª Fase ${nextYearPrediction.year} (Previsto)` : `2ª Fase ${lastYearGrades?.year || ''}`,
        grade: nextYearPrediction?.fase2?.predicted ?? lastYearGrades?.fase2 
      },
      { 
        id: 'f3', 
        label: nextYearPrediction?.year ? `3ª Fase ${nextYearPrediction.year} (Previsto)` : `3ª Fase ${lastYearGrades?.year || ''}`,
        grade: nextYearPrediction?.fase3?.predicted ?? lastYearGrades?.fase3 
      },
    ]

    return targets
      .filter(t => t.grade !== null && t.grade !== undefined)
      .map(t => ({
        id: t.id,
        label: t.label,
        info: evaluateProbability(userGrade, t.grade)
      }))
      .filter(p => p.info !== null)
  }, [calcResult, lastYearGrades, nextYearPrediction])

  return (
    <div className={styles.simulator}>
      <div className={styles.simulatorContent}>
        
        {/* Secção de Inputs */}
        <div className={styles.inputSection}>
          <h4 className={styles.sectionTitle}>Simule a sua Candidatura</h4>
          <p className={styles.sectionDesc}>Escala de 0 a 200 pontos</p>

          <div className={styles.inputGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <span className={styles.labelText}>Nota Interna do Secundário</span>
                <span className={styles.weight}>({pesos.sec}% do cálculo)</span>
              </label>
              <input
                type="number"
                min="0"
                max="200"
                placeholder="Ex: 180"
                value={notaInterna}
                onChange={(e) => setNotaInterna(e.target.value)}
                className={styles.input}
              />
            </div>

            {selectedSet.length > 0 ? (
              selectedSet.map((prova, idx) => (
                <div className={styles.inputGroup} key={`${prova.code}-${idx}`}>
                  <label className={styles.label}>
                    <span className={styles.labelText}>Prova: {prova.name}</span>
                    <span className={styles.weight}>
                      ({prova.weight ? `${prova.weight}%` : `${(pesos.pi / selectedSet.length).toFixed(0)}%`})
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    placeholder="0-200"
                    value={notasExames[idx] || ''}
                    onChange={(e) => handleExamChange(idx, e.target.value)}
                    className={styles.input}
                  />
                </div>
              ))
            ) : (
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <span className={styles.labelText}>Média das Provas de Ingresso</span>
                </label>
                <input
                  type="number"
                  disabled
                  placeholder="Selecione um curso acima"
                  className={styles.input}
                />
              </div>
            )}
          </div>

          <button type="button" className={styles.calcBtn} onClick={calcular}>
            Calcular Média
          </button>
        </div>

        {/* Secção de Comparação */}
        {calcResult && (
          <>
            <div className={styles.resultSection}>
              <div className={styles.userGradeBox}>
                <p className={styles.boxLabel}>Sua Média de Candidatura</p>
                <p className={styles.boxValue}>{calcResult}</p>
              </div>
            </div>

            {/* Probabilidades de Entrada por Fase */}
            {phaseProbabilities.length > 0 && (
              <div className={styles.probabilitySection}>
                {phaseProbabilities.map((phase) => (
                  <div
                    key={phase.id}
                    className={styles.probabilityBox}
                    style={{ borderLeftColor: phase.info.color, marginBottom: '12px' }}
                  >
                    <div className={styles.probabilityHeader}>
                      <span className={styles.probabilityIcon}>{phase.info.icon}</span>
                      <div className={styles.probabilityText}>
                        <p className={styles.probabilityLabel}>Probabilidade ({phase.label})</p>
                        <p className={styles.probabilityValue} style={{ color: phase.info.color }}>
                          {phase.info.probability}
                        </p>
                      </div>
                    </div>
                    <p className={styles.probabilityRecommendation}>
                      {phase.info.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}