import { useState, useEffect, useMemo } from 'react'

/**
 * Hook para pesquisar cursos com sugestões em tempo real
 * Carrega dados de todos os anos (dados_dges_YYYY.json)
 * Fornece autocomplete e filtros funcionais
 */
export function useCourseSearchWithSuggestions(dataPath = '/data') {
  const [allCourses, setAllCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Carregar dados de todos os anos
  useEffect(() => {
    const loadAllYears = async () => {
      try {
        setLoading(true)
        const courses = []
        const seenKeys = new Set()

        // Carregar dados de 2017 a 2024
        for (let year = 2017; year <= 2024; year++) {
          try {
            const response = await fetch(`${dataPath}/dados_dges_${year}.json`)
            if (!response.ok) continue

            const yearData = await response.json()
            if (Array.isArray(yearData)) {
              for (const course of yearData) {
                // Remover duplicatas por code
                const key = `${course.codigo_instituicao}-${course.codigo_curso}`
                if (!seenKeys.has(key)) {
                  seenKeys.add(key)
                  courses.push(course)
                }
              }
            }
          } catch (err) {
            console.warn(`Erro ao carregar dados de ${year}:`, err)
          }
        }

        setAllCourses(courses)
        setError(null)
      } catch (err) {
        console.error('Erro ao carregar dados dos cursos:', err)
        setError('Erro ao carregar base de dados de cursos')
      } finally {
        setLoading(false)
      }
    }

    loadAllYears()
  }, [dataPath])

  // Extrair filtros únicos
  const filterOptions = useMemo(() => {
    if (allCourses.length === 0) {
      return {
        distritos: [],
        tipos: [],
        areasCientificas: [],
        exames: []
      }
    }

    const distritos = new Set()
    const tipos = new Set()
    const areasCientificas = new Set()

    for (const course of allCourses) {
      const instituicao = course.instituicao || ''

      // Extrair tipo de instituição
      if (instituicao.includes('Instituto Politécnico')) {
        tipos.add('Instituto Politécnico')
      } else if (instituicao.includes('Universidade')) {
        tipos.add('Universidade')
      } else if (instituicao.includes('Escola Superior')) {
        tipos.add('Escola Superior')
      }

      // Extrair distrito/localização
      if (instituicao.includes('Lisboa') || instituicao.includes('IST') || instituicao.includes('ISCTE')) {
        distritos.add('Lisboa')
      } else if (instituicao.includes('Porto')) {
        distritos.add('Porto')
      } else if (instituicao.includes('Coimbra')) {
        distritos.add('Coimbra')
      } else if (instituicao.includes('Aveiro')) {
        distritos.add('Aveiro')
      } else if (instituicao.includes('Algarve')) {
        distritos.add('Algarve')
      } else if (instituicao.includes('Braga') || instituicao.includes('Minho')) {
        distritos.add('Braga/Minho')
      } else if (instituicao.includes('Madeira')) {
        distritos.add('Madeira')
      } else if (instituicao.includes('Açores')) {
        distritos.add('Açores')
      } else if (instituicao.includes('Évora')) {
        distritos.add('Évora')
      } else if (instituicao.includes('Beja')) {
        distritos.add('Beja')
      } else if (instituicao.includes('Castelo Branco')) {
        distritos.add('Castelo Branco')
      } else if (instituicao.includes('Guarda')) {
        distritos.add('Guarda')
      } else if (instituicao.includes('Leiria')) {
        distritos.add('Leiria')
      } else if (instituicao.includes('Viseu')) {
        distritos.add('Viseu')
      } else if (instituicao.includes('Viana')) {
        distritos.add('Viana do Castelo')
      } else if (instituicao.includes('Santarém')) {
        distritos.add('Santarém')
      } else if (instituicao.includes('Portalegre')) {
        distritos.add('Portalegre')
      }

      // Extrair áreas científicas (por keywords nos nomes de cursos)
      const cursoLower = (course.curso || '').toLowerCase()
      if (
        cursoLower.includes('engenharia') ||
        cursoLower.includes('informática') ||
        cursoLower.includes('tecnologia')
      ) {
        areasCientificas.add('Engenharia e Tecnologia')
      }
      if (cursoLower.includes('saúde') || cursoLower.includes('medicina') || cursoLower.includes('farmácia')) {
        areasCientificas.add('Saúde')
      }
      if (cursoLower.includes('direito') || cursoLower.includes('economia') || cursoLower.includes('gestão')) {
        areasCientificas.add('Ciências Sociais e Económicas')
      }
      if (
        cursoLower.includes('arte') ||
        cursoLower.includes('design') ||
        cursoLower.includes('comunicação')
      ) {
        areasCientificas.add('Artes e Humanidades')
      }
      if (cursoLower.includes('educação') || cursoLower.includes('pedagogia')) {
        areasCientificas.add('Educação')
      }
    }

    return {
      distritos: Array.from(distritos).sort(),
      tipos: Array.from(tipos).sort(),
      areasCientificas: Array.from(areasCientificas).sort(),
      exames: [] // Exames virão de cursos_detalhes.json
    }
  }, [allCourses])

  /**
   * Pesquisar cursos com filtros
   */
  const search = (query = '', filters = {}) => {
    let results = [...allCourses]

    // Filtrar por query (search nos nomes)
    if (query && query.trim()) {
      const queryLower = query.toLowerCase()
      results = results.filter((course) => {
        const courseStr = `${course.curso || ''} ${course.instituicao || ''}`
        return courseStr.toLowerCase().includes(queryLower)
      })
    }

    // Filtrar por distrito
    if (filters.distrito && filters.distrito.trim()) {
      results = results.filter((course) => {
        const inst = course.instituicao || ''
        switch (filters.distrito) {
          case 'Lisboa':
            return inst.includes('Lisboa') || inst.includes('IST') || inst.includes('ISCTE')
          case 'Porto':
            return inst.includes('Porto')
          case 'Coimbra':
            return inst.includes('Coimbra')
          case 'Aveiro':
            return inst.includes('Aveiro')
          case 'Algarve':
            return inst.includes('Algarve')
          case 'Braga/Minho':
            return inst.includes('Braga') || inst.includes('Minho')
          case 'Madeira':
            return inst.includes('Madeira')
          case 'Açores':
            return inst.includes('Açores')
          case 'Évora':
            return inst.includes('Évora')
          case 'Beja':
            return inst.includes('Beja')
          case 'Castelo Branco':
            return inst.includes('Castelo Branco')
          case 'Guarda':
            return inst.includes('Guarda')
          case 'Leiria':
            return inst.includes('Leiria')
          case 'Viseu':
            return inst.includes('Viseu')
          case 'Viana do Castelo':
            return inst.includes('Viana')
          case 'Santarém':
            return inst.includes('Santarém')
          case 'Portalegre':
            return inst.includes('Portalegre')
          default:
            return true
        }
      })
    }

    // Filtrar por tipo de instituição
    if (filters.tipo && filters.tipo.trim()) {
      results = results.filter((course) => {
        const inst = course.instituicao || ''
        if (filters.tipo === 'Instituto Politécnico') {
          return inst.includes('Instituto Politécnico')
        } else if (filters.tipo === 'Universidade') {
          return inst.includes('Universidade')
        } else if (filters.tipo === 'Escola Superior') {
          return inst.includes('Escola Superior') && !inst.includes('Instituto Politécnico')
        }
        return true
      })
    }

    // Filtrar por área científica
    if (filters.area && filters.area.trim()) {
      results = results.filter((course) => {
        const cursoLower = (course.curso || '').toLowerCase()
        switch (filters.area) {
          case 'Engenharia e Tecnologia':
            return (
              cursoLower.includes('engenharia') ||
              cursoLower.includes('informática') ||
              cursoLower.includes('tecnologia')
            )
          case 'Saúde':
            return (
              cursoLower.includes('saúde') ||
              cursoLower.includes('medicina') ||
              cursoLower.includes('farmácia')
            )
          case 'Ciências Sociais e Económicas':
            return (
              cursoLower.includes('direito') ||
              cursoLower.includes('economia') ||
              cursoLower.includes('gestão')
            )
          case 'Artes e Humanidades':
            return (
              cursoLower.includes('arte') ||
              cursoLower.includes('design') ||
              cursoLower.includes('comunicação')
            )
          case 'Educação':
            return cursoLower.includes('educação') || cursoLower.includes('pedagogia')
          default:
            return true
        }
      })
    }

    return results
  }

  /**
   * Obter sugestões de autocomplete baseado em query
   */
  const getSuggestions = (query = '', maxSuggestions = 10) => {
    if (!query || query.trim().length < 2) {
      return []
    }

    const queryLower = query.toLowerCase()
    const suggestions = allCourses
      .filter((course) => {
        const courseStr = `${course.curso || ''} ${course.instituicao || ''}`
        return courseStr.toLowerCase().includes(queryLower)
      })
      .map((course) => ({
        id: `${course.codigo_instituicao}-${course.codigo_curso}`,
        text: `${course.curso} - ${course.instituicao}`,
        course: course
      }))
      .slice(0, maxSuggestions)

    return suggestions
  }

  return {
    allCourses,
    loading,
    error,
    filterOptions,
    search,
    getSuggestions
  }
}
