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

  // Sincronizar os inputs com o conjunto de exames selecionado
  useEffect(() => {
    setNotasExames(new Array(selectedSet.length).fill(''))
  }, [selectedSet])

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
    if (!predictions || !predictions.fase_1 || predictions.fase_1.length === 0) return null
    const nextPred = predictions.fase_1[0]
    return {
      year: nextPred.year,
      fase1: { predicted: nextPred.predicted, ciLow: nextPred.ciLow, ciHigh: nextPred.ciHigh },
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
    
    // Calcula a média das notas individuais das provas de ingresso
    const piValues = notasExames.map(v => parseFloat(v) || 0)
    const piMedia = piValues.length > 0 ? piValues.reduce((a, b) => a + b, 0) / piValues.length : 0
    
    // Calcula com base nos pesos da DGES (ex: ni * 0.50 + pi * 0.50)
    const media = (ni * (pesos.sec / 100) + piMedia * (pesos.pi / 100)) / 10
    setCalcResult(media.toFixed(1))
  }

  // Determinar a probabilidade
  const getProbabilidade = () => {
    if (!calcResult || !lastYearGrades) return null

    const userGrade = parseFloat(calcResult)
    const lastFase3 = lastYearGrades.fase3 || lastYearGrades.fase2 || lastYearGrades.fase1

    const diffLastYear = userGrade - (lastFase3 / 10)
    
    let probability = 'Muito Baixa'
    let color = '#ef4444'
    let icon = '❌'
    let recommendation = 'Nota abaixo dos registos recentes'

    if (diffLastYear >= 1.0) {
      probability = 'Muito Alta'
      color = '#059669'
      icon = '✅'
      recommendation = 'Nota bastante acima dos registos, entrada muito provável'
    } else if (diffLastYear >= 0.5) {
      probability = 'Alta'
      color = '#10b981'
      icon = '✅'
      recommendation = 'Nota acima dos registos, boa probabilidade de entrada'
    } else if (diffLastYear >= -0.2) {
      probability = 'Média'
      color = '#f59e0b'
      icon = '⚠️'
      recommendation = 'Nota próxima aos registos, entrada possível'
    } else if (diffLastYear >= -0.5) {
      probability = 'Baixa'
      color = '#f59e0b'
      icon = '⚠️'
      recommendation = 'Nota ligeiramente abaixo dos registos'
    }

    return { probability, color, icon, recommendation, diffLastYear }
  }

  const probabilidadeInfo = getProbabilidade()

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
                    <span className={styles.labelText}>{prova.name}</span>
                    {idx === 0 && <span className={styles.weight}>({pesos.pi}% total)</span>}
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

            {/* Probabilidade de Entrada */}
            {probabilidadeInfo && (
              <div className={styles.probabilitySection}>
                <div
                  className={styles.probabilityBox}
                  style={{ borderLeftColor: probabilidadeInfo.color }}
                >
                  <div className={styles.probabilityHeader}>
                    <span className={styles.probabilityIcon}>{probabilidadeInfo.icon}</span>
                    <div className={styles.probabilityText}>
                      <p className={styles.probabilityLabel}>Probabilidade de Entrada</p>
                      <p className={styles.probabilityValue} style={{ color: probabilidadeInfo.color }}>
                        {probabilidadeInfo.probability}
                      </p>
                    </div>
                  </div>
                  <p className={styles.probabilityRecommendation}>
                    {probabilidadeInfo.recommendation}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}