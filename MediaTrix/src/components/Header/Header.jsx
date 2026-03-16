import LogoIcon from '../../assets/icons/logo.svg?react'
import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <a href="#" className={styles.logo} aria-label="MediaTrix - Página inicial">
          <LogoIcon className={styles.logoIcon} />
          <span className={styles.logoText}>MediaTrix</span>
        </a>
        <nav className={styles.nav} aria-label="Navegação principal">
          <a href="#inicio" className={styles.navLink}>Início</a>
          <a href="#pesquisar" className={styles.navLink}>Pesquisar Cursos</a>
          <a href="#como-funciona" className={styles.navLink}>Como Funciona</a>
        </nav>
      </div>
    </header>
  )
}
