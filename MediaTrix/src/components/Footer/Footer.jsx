import LogoIcon from '../../assets/icons/logo.svg?react'
import styles from './Footer.module.css'

const columns = [
  {
    links: ['Início', 'Pesquisar Cursos', 'Como Funciona'],
  },
  {
    links: ['Fontes Oficiais', 'Limitações', 'Atualizações'],
  },
  {
    links: ['Reportar erro nos dados', 'Sugerir melhoria', 'Contactar equipa'],
  },
  {
    links: ['Email', 'Formulário', 'Redes sociais'],
  },
]

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <LogoIcon className={styles.logoIcon} />
            <span className={styles.logoText}>MediaTrix</span>
          </div>
          <p className={styles.tagline}>
            Prever Médias
            <br />
            Planear o Futuro
          </p>
        </div>
        {columns.map((col, i) => (
          <nav key={i} className={styles.col}>
            {col.links.map((link, j) => (
              <a key={j} href="#" className={styles.link}>
                {link}
              </a>
            ))}
          </nav>
        ))}
      </div>
      <div className={styles.bottom}>
        <button className={styles.backToTop} onClick={scrollToTop}>
          Voltar ao topo
        </button>
      </div>
    </footer>
  )
}
