import { useState, useMemo } from 'react'
import styles from './ApplicationSimulator.module.css'

export default function ApplicationSimulator({ data, predictions, courseName }) {
  const [notaInterna, setNotaInterna] = useState('')
  const [biologia, setBiologia] = useState('')
  const [fisica, setFisica] = useState('')
  const [calcResult, setCalcResult] = useState(null)

  // Obter a última nota de cada fase (2024 - último ano)
  const lastYearGrades = useMemo(() => {
    if (!data || data.length === 0) return null
    
    // data é um array ordenado por ano, o último elemento é 2024
    const lastEntry = data[data.length - 1]
    
    return {
      fase1: lastEntry.Fase_1,
      fase2: lastEntry.Fase_2,
      fase3: lastEntry.Fase_3,
      year: lastEntry.year,
    }
  }, [data])

  // Obter a previsão para o próximo ano (2025)
  const nextYearPrediction = useMemo(() => {
    if (!predictions || !predictions.fase_1 || predictions.fase_1.length === 0) return null
    
    const nextPred = predictions.fase_1[0] // Primeira previsão é para o próximo ano
    
    return {
      year: nextPred.year,
      fase1: { predicted: nextPred.predicted, ciLow: nextPred.ciLow, ciHigh: nextPred.ciHigh },
      fase2: predictions.fase_2[0],
      fase3: predictions.fase_3[0],
    }
  }, [predictions])

  // Calcular a média baseada nas notas do utilizador
  const calcular = () => {
    const ni = parseFloat(notaInterna) || 0
    const bio = parseFloat(biologia) || 0
    const fis = parseFloat(fisica) || 0
    const media = (ni * 0.30 + bio * 0.35 + fis * 0.35) / 10
    setCalcResult(media.toFixed(1))
  }

  // Determinar a probabilidade de entrada com base nos valores calculados
  const getProbabilidade = () => {
    if (!calcResult || !lastYearGrades) return null

    const userGrade = parseFloat(calcResult)
    const lastFase3 = lastYearGrades.fase3 || lastYearGrades.fase2 || lastYearGrades.fase1

    // Comparação com o último ano
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
          <h4 className={styles.sectionTitle}>Insira As Suas Notas</h4>
          <p className={styles.sectionDesc}>Escala de 0 a 200 pontos</p>

          <div className={styles.inputGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <span className={styles.labelText}>Nota Interna do Secundário</span>
                <span className={styles.weight}>(30% do cálculo)</span>
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

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <span className={styles.labelText}>Biologia e Geologia</span>
                <span className={styles.weight}>(35% do cálculo)</span>
              </label>
              <input
                type="number"
                min="0"
                max="200"
                placeholder="Ex: 175"
                value={biologia}
                onChange={(e) => setBiologia(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <span className={styles.labelText}>Física e Química A</span>
                <span className={styles.weight}>(35% do cálculo)</span>
              </label>
              <input
                type="number"
                min="0"
                max="200"
                placeholder="Ex: 170"
                value={fisica}
                onChange={(e) => setFisica(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <button type="button" className={styles.calcBtn} onClick={calcular}>
            Calcular Média
          </button>
        </div>

        {/* Secção de Comparação */}
        {calcResult && (
          <>
            {/* Resultado Calculado */}
            <div className={styles.resultSection}>
              <div className={styles.userGradeBox}>
                <p className={styles.boxLabel}>Sua Média Estimada</p>
                <p className={styles.boxValue}>{calcResult}</p>
                <p className={styles.boxFormula}>
                  ({notaInterna} × 0.30 + {biologia} × 0.35 + {fisica} × 0.35) / 10
                </p>
              </div>
            </div>

            {/* Comparação com Último Ano */}
            {lastYearGrades && (
              <div className={styles.comparisonSection}>
                <h4 className={styles.sectionTitle}>Comparação com Registos Recentes</h4>
                
                <div className={styles.comparisonGrid}>
                  {/* Último Ano (2024) */}
                  <div className={styles.comparisonCard}>
                    <p className={styles.comparisonLabel}>{lastYearGrades.year} - Fase Final</p>
                    <p className={styles.comparisonValue}>
                      {(lastYearGrades.fase3 || lastYearGrades.fase2 || lastYearGrades.fase1) / 10}
                    </p>
                    <p className={styles.comparisonNote}>
                      Nota de entrada registada
                    </p>
                  </div>

                  {/* Diferença */}
                  <div className={`${styles.comparisonCard} ${styles.diffCard}`}>
                    <p className={styles.comparisonLabel}>Diferença</p>
                    <p
                      className={styles.comparisonValue}
                      style={{
                        color: probabilidadeInfo?.color || '#000',
                      }}
                    >
                      {probabilidadeInfo?.diffLastYear >= 0 ? '+' : ''}
                      {probabilidadeInfo?.diffLastYear?.toFixed(1)}
                    </p>
                    <p className={styles.comparisonNote}>
                      {probabilidadeInfo?.diffLastYear >= 0 ? 'Acima' : 'Abaixo'} dos registos
                    </p>
                  </div>

                  {/* Próxima Previsão */}
                  {nextYearPrediction && (
                    <div className={styles.comparisonCard}>
                      <p className={styles.comparisonLabel}>{nextYearPrediction.year} - Previsão</p>
                      <p className={styles.comparisonValue}>
                        {(nextYearPrediction.fase3?.predicted || nextYearPrediction.fase2?.predicted || nextYearPrediction.fase1?.predicted) / 10}
                      </p>
                      <p className={styles.comparisonNote}>
                        IC 95%: {((nextYearPrediction.fase3?.ciLow || nextYearPrediction.fase2?.ciLow || nextYearPrediction.fase1?.ciLow) / 10).toFixed(1)} - {((nextYearPrediction.fase3?.ciHigh || nextYearPrediction.fase2?.ciHigh || nextYearPrediction.fase1?.ciHigh) / 10).toFixed(1)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

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

            {/* Dica Importante */}
            <div className={styles.tipBox}>
              <p className={styles.tipTitle}>💡 Informação Importante</p>
              <p className={styles.tipText}>
                Esta prévia é baseada apenas na média de candidatura. A admissão depende também de outros fatores como:
                número de vagas, número de candidatos, e fase de candidatura.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
