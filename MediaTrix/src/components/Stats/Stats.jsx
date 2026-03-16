import { useState, useEffect, useRef } from 'react'
import styles from './Stats.module.css'

const stats = [
  { value: 500, suffix: '+', label: 'Cursos Analisados', color: 'var(--color-primary)' },
  { value: 50, suffix: '+', label: 'Instituições', color: 'var(--color-secondary)' },
  { value: 5, suffix: '', label: 'Anos de Dados', color: 'var(--color-amber)' },
  { value: 95, suffix: '%', label: 'Precisão', color: 'var(--color-primary)' },
]

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

  return (
    <section className={styles.section} ref={ref}>
      <div className={`container ${styles.grid}`}>
        {stats.map((s, i) => (
          <StatItem key={i} {...s} inView={inView} />
        ))}
      </div>
    </section>
  )
}
