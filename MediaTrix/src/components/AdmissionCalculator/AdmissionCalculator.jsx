import { useEffect } from 'react'
import { useCourseDetailsById } from '../../hooks/useCourseDetailsById'
import styles from './AdmissionCalculator.module.css'

export default function AdmissionCalculator({ courseName, institutionName, selectedIdx, onSelect, onSelectedExamsChange }) {
  const { course, loading: isLoading, error } = useCourseDetailsById(courseName, institutionName)

  const provasConjuntos = course?.provas_ingresso || []
  const selectedConjunto = provasConjuntos[selectedIdx] || []

  // Chave única para persistência da escolha do conjunto
  const storageKey = `selected_exam_set_${courseName}_${institutionName}`

  // Recuperar escolha anterior ao carregar o curso
  useEffect(() => {
    if (course && provasConjuntos.length > 0) {
      const savedIdx = localStorage.getItem(storageKey)
      if (savedIdx !== null) {
        const idx = parseInt(savedIdx, 10)
        // Valida se o índice ainda é válido para o curso atual
        if (idx >= 0 && idx < provasConjuntos.length && idx !== selectedIdx) {
          onSelect(idx)
        }
      }
    }
  }, [course, courseName, institutionName, provasConjuntos.length])

  // Notifica o componente pai sobre os exames selecionados
  useEffect(() => {
    if (onSelectedExamsChange && selectedConjunto.length > 0) {
      onSelectedExamsChange(selectedConjunto)
    }
  }, [selectedConjunto, onSelectedExamsChange])

  if (isLoading) return <p className={styles.loading}>A carregar informações do curso...</p>
  if (error) return <p className={styles.error}>Erro: {error.message}</p>
  if (!course && !isLoading) return <p className={styles.noData}>Nenhum curso encontrado</p>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Provas de Ingresso</h3>
        {course.formula_nota && (
          <div className={styles.formulaBox}>
            <p className={styles.formulaLabel}>Fórmula de Cálculo:</p>
            <p className={styles.formulaText}>{course.formula_nota}</p>
          </div>
        )}
      </div>

      <div className={styles.examsList}>
        {provasConjuntos.length > 0 ? (
          <div className={styles.examBlock}>
            {provasConjuntos.length > 1 && (
              <div className={styles.alternativeLabel}>
                Escolha 1 dos {provasConjuntos.length} conjuntos válidos
              </div>
            )}

            <div className={styles.optionsContainer}>
              {provasConjuntos.map((conjunto, idx) => (
                <label
                  key={idx}
                  className={`${styles.examOption} ${selectedIdx === idx ? styles.selected : ''}`}
                >
                  <input
                    type="radio"
                    name="examSet"
                    checked={selectedIdx === idx}
                    onChange={() => {
                      localStorage.setItem(storageKey, idx)
                      onSelect(idx)
                    }}
                    className={styles.radioInput}
                  />
                  <div className={styles.optionContent}>
                    {conjunto.map((prova, i) => (
                      <div key={i} className={styles.examRow}>
                        <div className={styles.examInfo}>
                          <span className={styles.examCode}>{prova.code}</span>
                          <span className={styles.examName}>
                            {prova.name}
                            {prova.weight && <span className={styles.weightTag}>({prova.weight}%)</span>}
                          </span>
                        </div>

                        {/* Desenha a etiqueta "E" centrada entre os exames */}
                        {/*i < conjunto.length - 1 && (
                          <div className={styles.separatorContainer}>
                            <span className={styles.separatorE}>
                              E
                            </span>
                          </div>
                        )*/}
                      </div>
                    ))}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <p className={styles.noExams}>Sem provas de ingresso definidas na base de dados.</p>
        )}
      </div>

      {/* Resumo */}
      {provasConjuntos.length > 0 && (
        <div className={styles.summarySection}>
          <h4 className={styles.summaryTitle}>Provas Necessárias</h4>
          <div className={styles.summaryList}>
            {selectedConjunto.map((prova, idx) => (
              <div key={idx} className={styles.summaryItem}>
                <span className={styles.summaryCode}>{prova.code}</span>
                <span className={styles.summaryName}>
                  {prova.name}
                  {prova.weight && <span className={styles.weightTagSummary}> ({prova.weight}%)</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.infoBox}>
        <p className={styles.infoTitle}>Dica:</p>
        <p className={styles.infoText}>
          A sua "Média das Provas de Ingresso" no simulador deve corresponder à média dos exames que constituem o conjunto que escolher acima.
        </p>
      </div>
    </div>
  )
}