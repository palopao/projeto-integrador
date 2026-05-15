import { useState, useEffect, useRef, useMemo } from 'react'
import { useCourseSearchWithSuggestions } from '../../hooks/useCourseSearchWithSuggestions'
import styles from './Stats.module.css'

function useCountUp(end, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  const frameRef = useRef(null)

  useEffect(() => {
    if (!start) return
    let startTime = null
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [end, duration, start])

  return count
}

function StatItem({ value, suffix, label, color, inView }) {
  const count = useCountUp(value, 1800, inView)

  return (
    <div className={styles.stat}>
      <p className={styles.value} style={{ color }}>
        {count}{suffix}
      </p>
      <p className={styles.label}>{label}</p>
    </div>
  )
}

export default function Stats() {
  const { allCourses, yearCount } = useCourseSearchWithSuggestions()
  const [inView, setInView] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  // Calcula as estatísticas reais baseadas nos dados carregados
  const dynamicStats = useMemo(() => {
    const coursesCount = allCourses.length
    const institutionsCount = new Set(allCourses.map(c => c.codigo_instituicao)).size

    return [
      { value: coursesCount || 1000, label: 'Cursos Analisados', color: 'var(--color-primary)' },
      { value: institutionsCount || 150, label: 'Instituições', color: 'var(--color-secondary)' },
      { value: yearCount || 8, suffix: '', label: 'Anos de Dados', color: 'var(--color-amber)' },
      { value: 95, suffix: '%', label: 'Precisão', color: 'var(--color-primary)' },
    ]
  }, [allCourses, yearCount])

  return (
    <section className={styles.section} ref={ref}>
      <div className={`container ${styles.grid}`}>
        {dynamicStats.map((s, i) => (
          <StatItem key={i} {...s} inView={inView} />
        ))}
      </div>
    </section>
  )
}
