import { useState, useEffect, useCallback } from 'react'
import { loadCourseDetails } from '../services/examDataService'

/**
 * Hook para pesquisar cursos com base em query e filtros
 */
export function useCourseSearch(query = '', filters = {}, dataPath = '/data') {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!query && Object.values(filters).every(v => !v)) {
      setCourses([])
      return
    }

    const searchCourses = async () => {
      setLoading(true)
      setError(null)

      try {
        const allCourses = await loadCourseDetails(`${dataPath}/cursos_detalhes.json`)

        // Filtrar baseado em query e filtros
        const filtered = allCourses.filter((course) => {
          const courseStr = course.curso.toLowerCase()
          const queryStr = query.toLowerCase()

          // Verificar query
          if (queryStr && !courseStr.includes(queryStr)) {
            return false
          }

          // Verificar filtros (se existirem, fazer match)
          // Nota: os filtros específicos dependem da estrutura do JSON
          // Por enquanto, apenas implementamos a pesquisa por query

          return true
        })

        setCourses(filtered)

        if (filtered.length === 0 && query) {
          setError(`Nenhum curso encontrado para "${query}"`)
        }
      } catch (err) {
        console.error('Erro ao pesquisar cursos:', err)
        setError(err instanceof Error ? err.message : 'Erro ao pesquisar')
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    searchCourses()
  }, [query, filters, dataPath])

  return { courses, loading, error }
}
