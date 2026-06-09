import { useState, useEffect, useRef, useMemo } from 'react'
import { loadMultipleYearsData, aggregateCoursePhaseEvolution, predictPhaseEvolution, loadCourseYearData } from '../services/examDataService'

/**
 * Hook para carregar e agregar dados de evolução de fases de um curso
 */
export function useCoursePhaseEvolution(
  courseName,
  institutionName,
  dataPath = '/data'
) {
  const [data, setData] = useState(null)
  const [predictions, setPredictions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [yearRange, setYearRange] = useState({ min: null, max: null })

  // Ref para armazenar os dados carregados apenas uma vez
  const dataByYearRef = useRef(null)

  useEffect(() => {
    if (!courseName || !institutionName) {
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)
    setError(null)

    const loadDataAsync = async () => {
      try {
        // Carrega os dados apenas uma vez
        if (!dataByYearRef.current) {
          const discoveredYears = [];
          let currentYear = 2017;
          let hasMoreData = true;

          while (hasMoreData) {
            try {
              // Tenta carregar os dados para o ano atual.
              // loadCourseYearData lançará um erro se o ficheiro não existir (response.ok for false).
              await loadCourseYearData(currentYear, dataPath);
              discoveredYears.push(currentYear);
              currentYear++;
            } catch (err) {
              // Se loadCourseYearData lançar um erro, significa que o ficheiro para este ano não existe
              // ou houve um erro de rede. Assumimos que não há mais ficheiros de dados para anos subsequentes.
              hasMoreData = false;
            }
          }
          if (discoveredYears.length === 0) {
            throw new Error('Nenhum dado de ano encontrado a partir de 2017.');
          }
          const loadedData = await loadMultipleYearsData(discoveredYears, dataPath)
          dataByYearRef.current = loadedData
        }

        const newEvolutionData = aggregateCoursePhaseEvolution(
          courseName,
          institutionName,
          dataByYearRef.current,
        );

        // Only update state if the data has actually changed (deep comparison)
        if (JSON.stringify(newEvolutionData) !== JSON.stringify(data)) {
            setData(newEvolutionData);
        }

        const yearArrays = Array.from(dataByYearRef.current.keys()).sort((a, b) => a - b);

        if (mounted) {
          setYearRange({
            min: yearArrays.length > 0 ? yearArrays[0] : null,
            max: yearArrays.length > 0 ? yearArrays[yearArrays.length - 1] : null,
          })

          try {
            const newPredictionData = predictPhaseEvolution(newEvolutionData, 1);
            // Only update state if the predictions have actually changed (deep comparison)
            if (JSON.stringify(newPredictionData) !== JSON.stringify(predictions)) {
                setPredictions(newPredictionData);
            }
          } catch (predErr) {
            console.warn('Erro ao calcular previsões:', predErr)
            setPredictions(null)
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados de evolução:', err)
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Erro desconhecido'))
          setData(null)
          setPredictions(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadDataAsync()

    return () => {
      mounted = false
    }
  }, [courseName, institutionName, dataPath])

  const refetch = () => {
    if (courseName && institutionName && dataByYearRef.current) {
      try {
        const evolutionData = aggregateCoursePhaseEvolution(
          courseName,
          institutionName,
          dataByYearRef.current,
        );
        if (JSON.stringify(evolutionData) !== JSON.stringify(data)) {
            setData(evolutionData);
        }
        
        const yearArrays = Array.from(dataByYearRef.current.keys()).sort((a, b) => a - b)
        setYearRange({
          min: yearArrays.length > 0 ? yearArrays[0] : null,
          max: yearArrays.length > 0 ? yearArrays[yearArrays.length - 1] : null,
        })

        try {
          const predictionData = predictPhaseEvolution(evolutionData, 1)
          if (JSON.stringify(predictionData) !== JSON.stringify(predictions)) {
            setPredictions(predictionData);
          }
        } catch (predErr) {
          console.warn('Erro ao calcular previsões:', predErr)
          setPredictions(null)
        }

        setError(null)
      } catch (err) {
        console.error('Erro ao recarregar dados de evolução:', err)
        setError(err instanceof Error ? err : new Error('Erro desconhecido'))
        setData(null)
        setPredictions(null)
      }
    }
  }

  return {
    data,
    predictions,
    loading,
    error,
    yearRange,
    refetch,
  }
}
