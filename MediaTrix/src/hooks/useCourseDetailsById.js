import { useState, useEffect, useCallback } from 'react'
import { loadCourseDetails } from '../services/examDataService'
import { normalize } from '../utils/normalize'

/**
 * Hook para carregar detalhes de um curso específico
 */
export function useCourseDetailsById(courseName, institutionName, dataPath = '/data') {
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!courseName || !institutionName) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    let mounted = true

    const loadData = async () => {
      try {
        const allCourses = await loadCourseDetails(`${dataPath}/cursos_detalhes.json`)

        const targetCourseNorm = normalize(courseName)
        const targetInstNorm = normalize(institutionName)
        
        if (!targetCourseNorm || !targetInstNorm) {
          setCourse(null)
          return
        }

        console.log(`Procurando curso: ${targetCourseNorm} | ${targetInstNorm}`);

        // Procura robusta: tenta match exato, depois tenta encontrar por inclusão mútua
        const foundCourse = allCourses.find(
          (c) => normalize(c.curso || '') === targetCourseNorm && normalize(c.instituicao || '') === targetInstNorm
        ) || allCourses.find(
          (c) => {
            const cCourse = normalize(c.curso || '');
            const cInst = normalize(c.instituicao || '');
            if (!cCourse || !cInst) return false;
            
            const courseMatch = cCourse === targetCourseNorm || cCourse.includes(targetCourseNorm) || targetCourseNorm.includes(cCourse);
            const instMatch = cInst === targetInstNorm || cInst.includes(targetInstNorm) || targetInstNorm.includes(cInst);
            
            return courseMatch && instMatch;
          }
        )

        if (!foundCourse) {
            console.warn(`Curso não encontrado: ${targetCourseNorm} | ${targetInstNorm}`);
        } else {
            console.log(`Curso encontrado:`, foundCourse);
        }

        if (mounted) {
          setCourse(foundCourse || null)
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
  }, [courseName, institutionName, dataPath])

  const refetch = () => {
    if (courseName && institutionName) {
      setLoading(true)
      setError(null)
      
      loadCourseDetails(`${dataPath}/cursos_detalhes.json`)
        .then((allCourses) => {
          const targetCourseNorm = normalize(courseName)
          const targetInstNorm = normalize(institutionName)

          if (!targetCourseNorm || !targetInstNorm) {
            setCourse(null)
            return
          }

          const foundCourse = allCourses.find(
            (c) => normalize(c.curso || '') === targetCourseNorm && normalize(c.instituicao || '') === targetInstNorm
          ) || allCourses.find(
            (c) => {
              const cCourse = normalize(c.curso || '');
              const cInst = normalize(c.instituicao || '');
              if (!cCourse || !cInst) return false;
              
              const courseMatch = cCourse === targetCourseNorm || cCourse.includes(targetCourseNorm) || targetCourseNorm.includes(cCourse);
              const instMatch = cInst === targetInstNorm || cInst.includes(targetInstNorm) || targetInstNorm.includes(cInst);
              
              return courseMatch && instMatch;
            }
          )

          setCourse(foundCourse || null)
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
