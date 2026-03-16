import WarningIcon from '../../assets/icons/warning.svg?react'
import CheckCircleIcon from '../../assets/icons/check-circle.svg?react'
import styles from './Limitations.module.css'

const items = [
  {
    bold: 'Previsões não são garantias:',
    text: ' As médias podem variar devido a fatores externos (mudanças nos exames, número de candidatos, etc.).',
  },
  {
    bold: 'Intervalos de confiança:',
    text: ' Apresentamos sempre uma faixa de valores, não um número exato.',
  },
  {
    bold: 'Dados históricos:',
    text: ' Baseamo-nos em padrões passados que podem não se repetir.',
  },
  {
    bold: 'Atualização anual:',
    text: ' O modelo é atualizado automaticamente com novos dados oficiais.',
  },
]

export default function Limitations() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.warningIcon}>
              <WarningIcon />
            </div>
            <h2 className={styles.title}>Limitações e Transparência</h2>
          </div>
          <ul className={styles.list}>
            {items.map((item, i) => (
              <li key={i} className={styles.item}>
                <CheckCircleIcon className={styles.checkIcon} />
                <p className={styles.text}>
                  <strong>{item.bold}</strong>{item.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
