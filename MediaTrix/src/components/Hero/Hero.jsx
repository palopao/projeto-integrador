import SearchIcon from '../../assets/icons/search.svg?react'
import PlayIcon from '../../assets/icons/play.svg?react'
import DataOfficialIcon from '../../assets/icons/data-official.svg?react'
import AnalysisIcon from '../../assets/icons/analysis.svg?react'
import PredictionsIcon from '../../assets/icons/predictions.svg?react'
import styles from './Hero.module.css'

const features = [
  { icon: DataOfficialIcon, title: 'Dados Oficiais', desc: 'DGES + Exames Nacionais' },
  { icon: AnalysisIcon, title: 'Análise Estatística', desc: 'Modelos preditivos avançados' },
  { icon: PredictionsIcon, title: 'Previsões Precisas', desc: 'Intervalos de confiança' },
]

export default function Hero() {
  return (
    <section id="inicio" className={styles.hero}>
      <div className={styles.circle1} />
      <div className={styles.circle2} />
      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          <span className={styles.badge}>Previsões baseadas em dados oficiais</span>
          <h1 className={styles.title}>
            Descobre a tua{' '}
            <br />
            média de acesso ao{' '}
            <br />
            <span className={styles.highlight}>ensino superior</span>
          </h1>
          <p className={styles.subtitle}>
            Previsões estatísticas de médias de acesso com base em
            dados históricos da DGES e exames nacionais. Toma
            decisões informadas para o teu futuro.
          </p>
          <div className={styles.ctas}>
            <a href="#pesquisar" className={styles.ctaPrimary}>
              <SearchIcon className={styles.ctaIcon} />
              Pesquisar Curso
            </a>
            <a href="#como-funciona" className={styles.ctaSecondary}>
              <PlayIcon className={styles.ctaPlayIcon} />
              Ver Como Funciona
            </a>
          </div>
        </div>
        <div className={styles.featureCard}>
          {features.map((f, i) => (
            <div key={i} className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <f.icon />
              </div>
              <div>
                <p className={styles.featureTitle}>{f.title}</p>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
