import { useState, useEffect, useRef } from 'react'
import LogoIcon from '../../assets/icons/logo.svg?react'
import styles from './Header.module.css'

export default function Header() {
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Lógica: Se estiver a fazer scroll para baixo e já passou de 100px, esconde.
      // Se estiver a fazer scroll para cima, mostra.
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header 
      className={styles.header}
      style={{
        transition: 'transform 0.3s ease-in-out',
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        position: 'fixed', // Torna o header fixo no topo
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}
    >
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
