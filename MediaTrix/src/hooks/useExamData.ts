import { useState, useEffect, useCallback } from 'react';
import type { CourseDetails, CourseYearData } from '../types/exams';
import {
  loadCourseDetails,
  loadCourseYearData,
  loadMultipleYearsData,
} from '../services/examDataService';

interface UseExamDataState {
  courseDetails: CourseDetails[] | null;
  courseYearData: Map<number, CourseYearData[]> | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook para carregar e gerenciar dados de exames
 * @param years - Anos para os quais carregar dados (exemplo: [2020, 2021, 2022, 2023, 2024])
 * @param dataPath - Caminho base para os ficheiros de dados
 */
export function useExamData(
  years: number[] = [2024],
  dataPath: string = '/data'
) {
  const [state, setState] = useState<UseExamDataState>({
    courseDetails: null,
    courseYearData: null,
    loading: true,
    error: null,
  });

  const loadData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Carrega os detalhes dos cursos e dados de múltiplos anos em paralelo
      const [courseDetailsData, courseYearDataMap] = await Promise.all([
        loadCourseDetails(dataPath + '/cursos_detalhes.json'),
        loadMultipleYearsData(years, dataPath),
      ]);

      setState({
        courseDetails: courseDetailsData,
        courseYearData: courseYearDataMap,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        courseDetails: null,
        courseYearData: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      });
    }
  }, [years, dataPath]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    courseDetails: state.courseDetails,
    courseYearData: state.courseYearData,
    loading: state.loading,
    error: state.error,
    refetch: loadData,
  };
}

/**
 * Hook para carregar dados de um ano específico
 */
export function useExamDataByYear(year: number, dataPath: string = '/data') {
  const [data, setData] = useState<CourseYearData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const yearData = await loadCourseYearData(year, dataPath);
      setData(yearData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [year, dataPath]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Hook para carregar apenas os detalhes dos cursos
 */
export function useCourseDetails(dataPath: string = '/data') {
  const [courseDetails, setCourseDetails] = useState<CourseDetails[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const details = await loadCourseDetails(dataPath + '/cursos_detalhes.json');
      setCourseDetails(details);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      setCourseDetails(null);
    } finally {
      setLoading(false);
    }
  }, [dataPath]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { courseDetails, loading, error, refetch };
}
