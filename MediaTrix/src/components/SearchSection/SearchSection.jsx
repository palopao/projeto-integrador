import { useState, useMemo } from 'react'
import React from 'react'
import { useCourseSearchWithSuggestions } from '../../hooks/useCourseSearchWithSuggestions'
import SearchIcon from '../../assets/icons/search.svg?react'
import SearchGrayIcon from '../../assets/icons/search-gray.svg?react'
import ChevronDownIcon from '../../assets/icons/chevron-down.svg?react'
import styles from './SearchSection.module.css'

export default function SearchSection({ onCourseSelect, selectedCourse = null }) {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [filters, setFilters] = useState({
    area: '',
    distrito: '',
    tipo: '',
    exames: '',
  })

  // Atualizar barra de pesquisa com nome do curso selecionado
  React.useEffect(() => {
    if (selectedCourse && selectedCourse.nome) {
      setQuery(selectedCourse.nome)
      setShowResults(false)
    }
  }, [selectedCourse?.codigoCurso]) // Atualizado quando código do curso muda

  const { loading, error, filterOptions, search } = useCourseSearchWithSuggestions()

  // Obter resultados baseado em query e filtros
  const results = useMemo(() => {
    const rawResults = search(query, filters)
    if (!rawResults) return []

    // Agrupar cursos com mesmo nome e instituição (para lidar com mudança de códigos)
    const groups = new Map()
    
    // Normalizar strings para comparação: remove acentos, pontuação, e "stop words" comuns.
    const normalize = (str) => {
      if (!str) return ''
      const stopWords = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'a', 'o', 'as', 'os', 'em', 'para', 'com', 'instituto', 'superior', 'faculdade', 'escola', 'universidade', 'politecnico', 'mestrado', 'integrado', 'licenciatura', 'preparatorios', 'ciclo', 'basico'])
      return str
        .toString()
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[-(),./]/g, ' ') // Substitui pontuação por espaços
        .split(/\s+/)
        .filter(word => word && !stopWords.has(word)) // Filtra palavras vazias e stop words
        .sort() // Ordena para tornar a chave canónica
        .join(' ')
    }
    
    rawResults.forEach(course => {
      const key = `${normalize(course.curso)}|${normalize(course.instituicao)}`
      if (!groups.has(key)) {
        groups.set(key, { ...course, codes: [{ inst: course.codigo_instituicao, curso: course.codigo_curso }] })
      } else {
        const entry = groups.get(key)
        if (!entry.codes.some(c => c.inst === course.codigo_instituicao && c.curso === course.codigo_curso)) {
          entry.codes.push({ inst: course.codigo_instituicao, curso: course.codigo_curso })
        }
      }
    })

    return Array.from(groups.values())
  }, [query, filters, search])

  const handleQueryChange = (e) => {
    const value = e.target.value
    setQuery(value)
    setShowResults(value.trim().length > 0)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setShowResults(true)
    }
  }

  const handleClearSearch = () => {
    setQuery('')
    setShowResults(false)
  }

  const handleSelectCourse = (course) => {
    if (onCourseSelect) {
      onCourseSelect(course)
    }
    setShowResults(false)
    // Não limpa a query - useEffect vai atualizar com o nome do curso
  }

  const handleFilterChange = (filterKey, value) => {
    setFilters({ ...filters, [filterKey]: value })
    setShowResults(true) // Mostrar resultados quando aplica filtro
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
              onChange={handleQueryChange}
              onFocus={() => query.trim().length > 0 && setShowResults(true)}
              aria-label="Pesquisar curso"
            />

            {query.length > 0 && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  position: 'absolute',
                  right: '40px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#9ca3af',
                  padding: '4px'
                }}
                aria-label="Limpar pesquisa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}

            <SearchGrayIcon className={styles.searchIcon} />
          </div>

          <div className={styles.filtersGrid}>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={filters.area}
                onChange={(e) => handleFilterChange('area', e.target.value)}
                aria-label="Área Científica"
              >
                <option value="">Área Científica</option>
                {filterOptions.areasCientificas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className={styles.chevron} />
            </div>

            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={filters.distrito}
                onChange={(e) => handleFilterChange('distrito', e.target.value)}
                aria-label="Distrito"
              >
                <option value="">Distrito</option>
                {filterOptions.distritos.map((distrito) => (
                  <option key={distrito} value={distrito}>
                    {distrito}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className={styles.chevron} />
            </div>

            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={filters.tipo}
                onChange={(e) => handleFilterChange('tipo', e.target.value)}
                aria-label="Tipo de Instituição"
              >
                <option value="">Tipo de Instituição</option>
                {filterOptions.tipos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className={styles.chevron} />
            </div>

            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={filters.exames}
                onChange={(e) => handleFilterChange('exames', e.target.value)}
                aria-label="Exames Específicos"
              >
                <option value="">Exames Específicos</option>
                <option value="com-exames">Com Exames Específicos</option>
                <option value="sem-exames">Sem Exames Específicos</option>
              </select>
              <ChevronDownIcon className={styles.chevron} />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn}>
            <SearchIcon className={styles.submitIcon} />
            Pesquisar Cursos
          </button>
        </form>

        {/* Search Results */}
        {showResults && (
          <div className={styles.resultsContainer}>
            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}
            {loading && (
              <div className={styles.loading}>
                A carregar cursos...
              </div>
            )}
            {!loading && results.length === 0 && (
              <div className={styles.noResults}>
                Nenhum curso encontrado com os filtros selecionados. Tenta com outro termo de pesquisa.
              </div>
            )}
            {!loading && results.length > 0 && (
              <div className={styles.resultsList}>
                <p className={styles.resultsCount}>
                  {results.length} curso{results.length > 1 ? 's' : ''} encontrado{results.length > 1 ? 's' : ''}
                </p>
                <ul>
                  {results.slice(0, 50).map((course, idx) => (
                    <li key={idx} className={styles.resultItem}>
                      <button
                        type="button"
                        className={styles.resultButton}
                        onClick={() => handleSelectCourse(course)}
                      >
                        <div className={styles.resultName}>{course.curso}</div>
                        <div className={styles.resultCode}>
                          {course.instituicao}
                        </div>
                        <div className={styles.resultMeta}>
                          {course.codes && course.codes.length > 1 
                            ? course.codes.map(c => `${c.inst}-${c.curso}`).join(' ou ')
                            : `${course.codigo_instituicao}-${course.codigo_curso}`}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                {results.length > 50 && (
                  <p className={styles.moreResults}>
                    Mostrando 50 de {results.length} resultados...
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
