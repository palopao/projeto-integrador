import { useState } from 'react'
import SearchIcon from '../../assets/icons/search.svg?react'
import SearchGrayIcon from '../../assets/icons/search-gray.svg?react'
import ChevronDownIcon from '../../assets/icons/chevron-down.svg?react'
import styles from './SearchSection.module.css'

const dropdowns = [
  { label: 'Área Científica', key: 'area' },
  { label: 'Distrito', key: 'distrito' },
  { label: 'Tipo de Instituição', key: 'tipo' },
  { label: 'Exames Específicos', key: 'exames' },
]

export default function SearchSection() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    area: '',
    distrito: '',
    tipo: '',
    exames: '',
  })

  const handleSearch = (e) => {
    e.preventDefault()
    // Search logic placeholder
  }

  return (
    <section id="pesquisar" className={styles.section}>
      <div className="container">
        <h2 className={styles.title}>Pesquisa o Teu Curso</h2>
        <p className={styles.subtitle}>
          Encontra previsões de médias de acesso para qualquer curso do ensino
          superior em Portugal
        </p>
        <form className={styles.form} onSubmit={handleSearch}>
          <div className={styles.searchInputWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Ex: Medicina, Engenharia Informática, Direito..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Pesquisar curso"
            />
            <SearchGrayIcon className={styles.searchIcon} />
          </div>
          <div className={styles.filtersGrid}>
            {dropdowns.map((d) => (
              <div key={d.key} className={styles.selectWrapper}>
                <select
                  className={styles.select}
                  value={filters[d.key]}
                  onChange={(e) => setFilters({ ...filters, [d.key]: e.target.value })}
                  aria-label={d.label}
                >
                  <option value="">{d.label}</option>
                </select>
                <ChevronDownIcon className={styles.chevron} />
              </div>
            ))}
          </div>
          <button type="submit" className={styles.submitBtn}>
            <SearchIcon className={styles.submitIcon} />
            Pesquisar Cursos
          </button>
        </form>
      </div>
    </section>
  )
}
