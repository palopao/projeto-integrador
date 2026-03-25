import { useState, useMemo } from 'react'
import styles from './AdmissionCalculator.module.css'

/**
 * Componente para exibir as provas de ingresso e permitir cálculo da média
 */
export default function AdmissionCalculator({ course, isLoading, error }) {
  const [selectedExams, setSelectedExams] = useState({})

  // Inicializa seleções (primeira opção se for alternativa, se não for obrigatória)
  const initialSelections = useMemo(() => {
    if (!course || !course.provas_ingresso) return {}

    const selections = {}
    course.provas_ingresso.forEach((position, idx) => {
      if ('options' in position && position.options.length > 0) {
        // Para alternativas, seleciona a primeira por padrão
        selections[idx] = 0
      }
    })
    return selections
  }, [course])

  // Sincroniza com as seleções iniciais
  const [selected, setSelected] = useState({})
  useMemo(() => {
    setSelected(initialSelections)
  }, [initialSelections])

  if (isLoading && !course) {
    return <p className={styles.loading}>Carregando informações do curso...</p>
  }

  if (error) {
    return <p className={styles.error}>Erro: {error.message}</p>
  }

  if (!course) {
    return <p className={styles.noData}>Nenhum curso encontrado</p>
  }

  const handleExamSelection = (positionIdx, optionIdx) => {
    setSelected((prev) => ({
      ...prev,
      [positionIdx]: optionIdx,
    }))
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Provas de Ingresso Obrigatórias</h3>
        {course.formula_nota && (
          <div className={styles.formulaBox}>
            <p className={styles.formulaLabel}>Fórmula de Cálculo:</p>
            <p className={styles.formulaText}>{course.formula_nota}</p>
          </div>
        )}
      </div>

      <div className={styles.examsList}>
        {course.provas_ingresso && course.provas_ingresso.length > 0 ? (
          course.provas_ingresso.map((position, posIdx) => {
            const isAlternatives = 'options' in position
            const options = isAlternatives ? position.options : [position]
            const selectedIdx = selected[posIdx] || 0
            const selectedExam = options[selectedIdx]

            return (
              <div key={posIdx} className={styles.examBlock}>
                {isAlternatives && (
                  <div className={styles.alternativeLabel}>
                    Escolha {"1"} de {options.length} opções
                  </div>
                )}

                <div className={styles.optionsContainer}>
                  {options.map((option, optIdx) => (
                    <label
                      key={optIdx}
                      className={`${styles.examOption} ${
                        selectedIdx === optIdx ? styles.selected : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name={`exam-${posIdx}`}
                        checked={selectedIdx === optIdx}
                        onChange={() => handleExamSelection(posIdx, optIdx)}
                        className={styles.radioInput}
                      />
                      <div className={styles.optionContent}>
                        <span className={styles.examCode}>{option.code}</span>
                        <span className={styles.examName}>{option.name}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {!isAlternatives && (
                  <div className={styles.requiredMark}>
                    <span>Obrigatória</span>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <p className={styles.noExams}>Sem provas de ingresso definidas</p>
        )}
      </div>

      {course.provas_ingresso && course.provas_ingresso.length > 0 && (
        <div className={styles.summarySection}>
          <h4 className={styles.summaryTitle}>Resumo das Provas Selecionadas</h4>
          <div className={styles.summaryList}>
            {course.provas_ingresso.map((position, idx) => {
              const isAlternatives = 'options' in position
              const options = isAlternatives ? position.options : [position]
              const selectedIdx = selected[idx] || 0
              const selectedExam = options[selectedIdx]

              return (
                <div key={idx} className={styles.summaryItem}>
                  <span className={styles.summaryCode}>{selectedExam.code}</span>
                  <span className={styles.summaryName}>{selectedExam.name}</span>
                  {isAlternatives && (
                    <span className={styles.summaryBadge}>Alternativa</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className={styles.infoBox}>
        <p className={styles.infoTitle}>Dica:</p>
        <p className={styles.infoText}>
          Ao selecionar "ou", escolha o exame onde tem melhor classificação para
          maximizar sua média de entrada.
        </p>
      </div>
    </div>
  )
}
