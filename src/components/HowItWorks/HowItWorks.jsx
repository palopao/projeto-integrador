import { useEffect, useRef, useState } from 'react'
import DataCollectIcon from '../../assets/icons/data-collect.svg?react'
import StatsAnalysisIcon from '../../assets/icons/stats-analysis.svg?react'
import BrainModelIcon from '../../assets/icons/brain-model.svg?react'
import ChartLineIcon from '../../assets/icons/chart-line.svg?react'
import styles from './HowItWorks.module.css'

const steps = [
  {
    icon: DataCollectIcon,
    color: 'var(--color-primary)',
    num: '01',
    numColor: 'var(--color-primary)',
    title: 'Recolha de Dados',
    desc: 'Extraímos automaticamente dados oficiais da DGES e estatísticas dos exames nacionais dos últimos anos.',
  },
  {
    icon: StatsAnalysisIcon,
    color: 'var(--color-secondary)',
    num: '02',
    numColor: 'var(--color-secondary)',
    title: 'Análise Estatística',
    desc: 'Analisamos tendências, correlações entre exames e médias de acesso, identificando padrões históricos.',
  },
  {
    icon: BrainModelIcon,
    color: 'var(--color-amber)',
    num: '03',
    numColor: 'var(--color-amber)',
    title: 'Modelo Preditivo',
    desc: 'Aplicamos modelos de regressão e séries temporais para gerar previsões com intervalos de confiança.',
  },
  {
    icon: ChartLineIcon,
    color: 'var(--color-primary)',
    num: '04',
    numColor: 'var(--color-primary)',
    title: 'Previsão Final',
    desc: 'Apresentamos um intervalo previsto com 95% de confiança, indicando a incerteza estatística.',
  },
]

export default function HowItWorks() {
  const [inView, setInView] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="como-funciona" className={styles.section} ref={ref}>
      <div className="container">
        <h2 className={styles.title}>Como Funciona o MediaTrix?</h2>
        <p className={styles.subtitle}>
          Transparência total no nosso modelo estatístico de previsão
        </p>
        <div className={styles.grid}>
          {steps.map((step, i) => (
            <div
              key={i}
              className={styles.card}
              style={{
                animationDelay: `${i * 120}ms`,
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0)' : 'translateY(24px)',
                transition: `opacity 0.5s ${i * 0.12}s, transform 0.5s ${i * 0.12}s`,
              }}
            >
              <div
                className={styles.iconBox}
                style={{ backgroundColor: step.color }}
              >
                <step.icon className={styles.icon} />
              </div>
              <p className={styles.num} style={{ color: step.numColor }}>{step.num}</p>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
