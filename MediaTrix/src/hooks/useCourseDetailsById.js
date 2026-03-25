import { useState, useEffect, useCallback } from 'react'
import { loadCourseDetails } from '../services/examDataService'

/**
 * Hook para carregar detalhes de um curso específico
 */
export function useCourseDetailsById(codigoInstituicao, codigoCurso, dataPath = '/data') {
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!codigoInstituicao || !codigoCurso) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    let mounted = true

    const loadData = async () => {
      try {
        const allCourses = await loadCourseDetails(`${dataPath}/cursos_detalhes.json`)

        const foundCourse = allCourses.find(
          (c) =>
            c.codigo_instituicao === codigoInstituicao &&
            c.codigo_curso === codigoCurso
        )

        if (!foundCourse) {
          throw new Error(`Curso não encontrado: ${codigoInstituicao}-${codigoCurso}`)
        }

        if (mounted) {
          setCourse(foundCourse)
          setError(null)
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes do curso:', err)
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Erro desconhecido'))
          setCourse(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [codigoInstituicao, codigoCurso, dataPath])

  const refetch = () => {
    if (codigoInstituicao && codigoCurso) {
      setLoading(true)
      setError(null)
      
      loadCourseDetails(`${dataPath}/cursos_detalhes.json`)
        .then((allCourses) => {
          const foundCourse = allCourses.find(
            (c) =>
              c.codigo_instituicao === codigoInstituicao &&
              c.codigo_curso === codigoCurso
          )

          if (!foundCourse) {
            throw new Error(`Curso não encontrado: ${codigoInstituicao}-${codigoCurso}`)
          }

          setCourse(foundCourse)
          setError(null)
        })
        .catch((err) => {
          console.error('Erro ao recarregar detalhes do curso:', err)
          setError(err instanceof Error ? err : new Error('Erro desconhecido'))
          setCourse(null)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }

  return { course, loading, error, refetch }
}
