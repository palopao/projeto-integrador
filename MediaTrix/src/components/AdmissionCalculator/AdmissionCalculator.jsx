import { useState, useEffect } from 'react'
import styles from './AdmissionCalculator.module.css'

export default function AdmissionCalculator({ course, isLoading, error }) {
  const [selectedIdx, setSelectedIdx] = useState(0)

  // Reseta a seleção se mudarmos de curso
  useEffect(() => {
    setSelectedIdx(0)
  }, [course])

  if (isLoading && !course) return <p className={styles.loading}>Carregando informações do curso...</p>
  if (error) return <p className={styles.error}>Erro: {error.message}</p>
  if (!course) return <p className={styles.noData}>Nenhum curso encontrado</p>

  const provasConjuntos = course.provas_ingresso || []
  const selectedConjunto = provasConjuntos[selectedIdx] || []

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
                    onChange={() => setSelectedIdx(idx)}
                    className={styles.radioInput}
                  />
                  {/* Nova formatação que empilha os exames na vertical */}
                  <div className={styles.optionContent} style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    {conjunto.map((prova, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className={styles.examCode}>{prova.code}</span>
                          <span className={styles.examName}>{prova.name}</span>
                        </div>

                        {/* Desenha a etiqueta "E" centrada entre os exames */}
                        {i < conjunto.length - 1 && (
                          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: '12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                              E
                            </span>
                          </div>
                        )}
                        
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
                <span className={styles.summaryName}>{prova.name}</span>
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