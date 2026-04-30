import type {
  CourseDetails,
  CourseYearData,
  ExamPosition,
  ExamOption,
  ExamAlternatives,
} from '../types/exams';
import { normalize } from '../utils/normalize';

/**
 * Serviço para processar e carregar dados de exames
 */

/**
 * Verifica se uma string é uma opção de prova (formato: "XX  Nome da Prova")
 */
function isExamOption(str: string): boolean {
  return /^\d{2}\s{2}/.test(str.trim());
}

/**
 * Converte uma string de prova em um objeto ExamOption
 * Formato esperado: "18  Português" -> { code: "18", name: "Português" }
 * Suporta pesos: "11  História (15%)" -> { code: "11", name: "História", weight: 15 }
 */
function parseExamOption(examStr: string): ExamOption {
  const trimmed = examStr.trim();
  const parts = trimmed.split(/\s{2,}/);
  const code = parts[0];
  let name = parts[1] || '';
  let weight: number | undefined;

  // Tenta extrair o peso se presente no formato "(XX%)" no final do nome
  const weightMatch = name.match(/\((\d+)%\)$/);
  if (weightMatch) {
    weight = parseInt(weightMatch[1], 10);
    // Remove a percentagem do nome para uma exibição limpa na interface
    name = name.replace(weightMatch[0], '').trim();
  }

  return {
    code,
    name,
    weight,
  } as any;
}

/**
 * Processa o array de provas de ingresso, agrupando opções separadas por "ou"
 * Exemplo:
 *   ["18  Português", "ou", "17  Mat. Apl", "18  Português"]
 *   ->
 *   [
 *     { options: [{ code: "18", name: "Português" }, { code: "17", name: "Mat. Apl" }] },
 *     { code: "18", name: "Português" }
 *   ]
 */
export function parseProvasIngresso(provas: string[]): any[] {
  if (!provas || provas.length === 0) return [];
  
  const result = [];
  let currentSet = [];

  for (const prova of provas) {
    if (prova.toLowerCase() === 'ou') {
      if (currentSet.length > 0) {
        result.push(currentSet);
        currentSet = [];
      }
      continue;
    }
    
    if (prova.toLowerCase() === 'e') continue; // Ignora o "e", apenas junta no mesmo grupo

    if (isExamOption(prova)) {
      currentSet.push(parseExamOption(prova));
    }
  }
  
  if (currentSet.length > 0) {
    result.push(currentSet);
  }

  return result;
}

/**
 * Carrega os detalhes dos cursos do ficheiro JSON
 */
export async function loadCourseDetails(
  path: string = '/data/cursos_detalhes.json',
  mapaDistritosPath: string = '/data/mapa_distritos.json'
): Promise<CourseDetails[]> {
  try {
    // Carrega detalhes dos cursos e o mapeamento de distritos em paralelo
    const [coursesResponse, distritosResponse] = await Promise.all([
      fetch(path),
      fetch(mapaDistritosPath).catch(() => null)
    ]);

    if (!coursesResponse.ok) {
      throw new Error(`Erro ao carregar detalhes dos cursos: ${coursesResponse.status}`);
    }

    const data = await coursesResponse.json();
    const mapaDistritos = distritosResponse && distritosResponse.ok 
      ? await distritosResponse.json() 
      : {};

    // Processa as provas de ingresso
    return data.map((course: any) => {
      // Normalização do código da instituição para 4 dígitos para garantir compatibilidade com o mapa
      const instCode = String(course.codigo_instituicao).padStart(4, '0');
      const infoDistrito = mapaDistritos[instCode];

      return {
        ...course,
        curso: course.nome_curso || course.curso || '', // Normaliza o nome do curso para consistência
        // Atribui o distrito com base no mapa, permitindo filtros precisos na pesquisa
        distrito: infoDistrito?.distrito || course.distrito || 'Outro',
        provas_ingresso: parseProvasIngresso(course.provas_ingresso || [])
      };
    });
  } catch (error) {
    console.error('Erro ao carregar dados de cursos:', error);
    throw error;
  }
}

/**
 * Calcula a nota final de candidatura (0-200) com base na fórmula e pesos dos exames.
 * Suporta tanto pesos globais quanto pesos individuais por prova de ingresso.
 */
export function calculateEntranceScore(
  secondaryAvg: number,
  selectedExams: { score: number; weight?: number }[],
  formulaText: string
): number {
  if (!formulaText || selectedExams.length === 0) return 0;

  // Extrai pesos da fórmula (ex: "Média do secundário: 45% | Provas de ingresso: 55%")
  const secondaryWeightMatch = formulaText.match(/secundário:\s*(\d+)%/i);
  const secondaryWeight = secondaryWeightMatch ? parseInt(secondaryWeightMatch[1], 10) : 50;
  
  const examsTotalWeightMatch = formulaText.match(/ingresso:\s*(\d+)%/i);
  const examsTotalWeight = examsTotalWeightMatch ? parseInt(examsTotalWeightMatch[1], 10) : (100 - secondaryWeight);

  // Verifica se as provas selecionadas têm pesos específicos definidos no JSON
  const hasIndividualWeights = selectedExams.some(e => e.weight !== undefined);

  if (hasIndividualWeights) {
    // Soma ponderada usando os pesos individuais extraídos do JSON
    const examsWithWeight = selectedExams.filter(e => e.weight !== undefined);
    const examsWithoutWeight = selectedExams.filter(e => e.weight === undefined);
    
    let examsWeightedSum = examsWithWeight.reduce((acc, e) => acc + (e.score * ((e.weight || 0) / 100)), 0);
    
    // Caso existam exames sem peso definido mas outros no mesmo grupo tenham, 
    // distribui o peso restante (total exames - pesos definidos) entre eles.
    if (examsWithoutWeight.length > 0) {
      const weightUsed = examsWithWeight.reduce((acc, e) => acc + (e.weight || 0), 0);
      const remainingWeight = Math.max(0, examsTotalWeight - weightUsed);
      const individualRemainingWeight = remainingWeight / examsWithoutWeight.length;
      examsWeightedSum += examsWithoutWeight.reduce((acc, e) => acc + (e.score * (individualRemainingWeight / 100)), 0);
    }
    
    return (secondaryAvg * (secondaryWeight / 100)) + examsWeightedSum;
  } else {
    // Média aritmética simples das provas selecionadas multiplicada pelo peso total dos exames
    const examsAvg = selectedExams.reduce((acc, e) => acc + e.score, 0) / selectedExams.length;
    return (secondaryAvg * (secondaryWeight / 100)) + (examsAvg * (examsTotalWeight / 100));
  }
}

/**
 * Carrega os dados de candidatura de um ano específico
 */
export async function loadCourseYearData(
  year: number,
  path: string = '/data'
): Promise<CourseYearData[]> {
  try {
    const filename = `dados_dges_${year}.json`;
    const response = await fetch(`${path}/${filename}`);

    if (!response.ok) {
      throw new Error(
        `Erro ao carregar dados de ${year}: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro ao carregar dados do ano ${year}:`, error);
    throw error;
  }
}

/**
 * Carrega dados de múltiplos anos
 */
export async function loadMultipleYearsData(
  years: number[],
  path: string = '/data'
): Promise<Map<number, CourseYearData[]>> {
  const dataByYear = new Map<number, CourseYearData[]>();

  const promises = years.map(async (year) => {
    try {
      const data = await loadCourseYearData(year, path);
      dataByYear.set(year, data);
    } catch (error) {
      console.warn(`Falha ao carregar dados de ${year}:`, error);
    }
  });

  await Promise.all(promises);
  return dataByYear;
}

/**
 * Encontra um curso pelos códigos de instituição e curso
 */
export function findCourse(
  courses: CourseDetails[],
  codigoInstituicao: string,
  codigoCurso: string
): CourseDetails | undefined {
  return courses.find(
    (c) =>
      String(c.codigo_instituicao).padStart(4, '0') === String(codigoInstituicao).padStart(4, '0') &&
      String(c.codigo_curso).padStart(4, '0') === String(codigoCurso).padStart(4, '0')
  );
}

/**
 * Filtra cursos por instituição
 */
export function filterCoursesByInstitution(
  courses: CourseDetails[],
  instituicao: string
): CourseDetails[] {
  return courses.filter((c) => c.curso.includes(instituicao));
}

/**
 * Verifica se uma posição de prova é um grupo de alternativas
 */
export function isAlternatives(position: ExamPosition): position is ExamAlternatives {
  return 'options' in position;
}

/**
 * Dados agregados de evolução de fases para um curso
 */
export interface PhaseEvolutionData {
  year: number | string;
  fase_1: number | null;
  fase_2: number | null;
  fase_3: number | null;
}

/**
 * Agrega dados de evolução de notas de um curso específico ao longo dos anos
 * Retorna um array ordenado de anos com as notas de cada fase
 */
export function aggregateCoursePhaseEvolution(
  courseName: string,
  institutionName: string,
  dataByYear: Map<number, CourseYearData[]>,
): PhaseEvolutionData[] {
  const years = Array.from(dataByYear.keys()).sort((a, b) => a - b)
  const normalizedTargetCourse = normalize(courseName);
  const normalizedTargetInst = normalize(institutionName);

  return years.map((year) => {
    const courses = dataByYear.get(year) || []

    // Encontrar por nome do curso e instituição (identificação primária)
    const courseData = courses.find((c) => {
      const normalizedCourse = normalize(c.curso);
      const normalizedInst = normalize(c.instituicao);
      return normalizedCourse === normalizedTargetCourse && normalizedInst === normalizedTargetInst;
    });

    return {
      year,
      fase_1: courseData?.fases?.fase_1?.nota ?? null,
      fase_2: courseData?.fases?.fase_2?.nota ?? null,
      fase_3: courseData?.fases?.fase_3?.nota ?? null,
    }
  })
}

/**
 * Obtém o intervalo de anos disponíveis nos dados
 */
export function getAvailableYears(dataByYear: Map<number, CourseYearData[]>): {
  min: number;
  max: number;
} {
  const years = Array.from(dataByYear.keys());
  return {
    min: Math.min(...years),
    max: Math.max(...years),
  };
}

/**
 * Resultado da previsão com intervalo de confiança
 */
export interface PredictionResult {
  year: number;
  predicted: number;
  ciLow: number;
  ciHigh: number;
}

/**
 * Função interna auxiliar para cálculo de previsões baseada em suavização exponencial e reversão à média.
 * Esta lógica centraliza a forma como as tendências são calculadas em toda a aplicação.
 */
function predictPhase(
  values: (number | null)[],
  years: number[],
  steps: number = 3
): PredictionResult[] | null {
  const clean = values
    .map((v, i) => (v != null ? { x: years[i], y: v } : null))
    .filter((v): v is { x: number; y: number } => v !== null);

  if (clean.length < 2) return null;

  const ys = clean.map((p) => p.y);
  const mean = ys.reduce((a, b) => a + b, 0) / ys.length;

  // Suavização exponencial (Alpha 0.5 dá peso equilibrado ao histórico recente)
  const alpha = 0.5;
  let smoothed = ys[0];
  for (let i = 1; i < ys.length; i++) {
    smoothed = alpha * ys[i] + (1 - alpha) * smoothed;
  }

  // Cálculo de erro residual para Intervalo de Confiança
  let residualSum = 0;
  for (let i = 1; i < ys.length; i++) {
    const prev = ys[i - 1];
    const predicted = alpha * ys[i] + (1 - alpha) * prev;
    residualSum += Math.pow(ys[i] - predicted, 2);
  }
  const residualVariance = residualSum / (ys.length - 1);
  const std = Math.sqrt(residualVariance);

  const predictions: PredictionResult[] = [];
  const lastYear = clean[clean.length - 1].x;

  for (let i = 1; i <= steps; i++) {
    const year = lastYear + i;

    // Regressão à média progressiva (impede que previsões fujam da realidade histórica)
    const weightToMean = Math.min(0.15 * i, 0.6);
    const predictedRaw = (1 - weightToMean) * smoothed + weightToMean * mean;
    const predicted = Math.max(0, Math.min(200, predictedRaw));

    // Margem de erro cresce com o tempo de previsão
    const growthFactor = 1 + i * 0.15;
    const margin = 1.28 * std * growthFactor;

    predictions.push({
      year,
      predicted: Math.round(predicted * 10) / 10,
      ciLow: Math.max(0, Math.round((predicted - margin) * 10) / 10),
      ciHigh: Math.min(200, Math.round((predicted + margin) * 10) / 10),
    });
  }

  return predictions;
}

/**
 * Prediz os próximos anos para as 3 fases usando suavização exponencial
 */
export function predictPhaseEvolution(
  data: PhaseEvolutionData[],
  yearsAhead: number = 3
): {
  fase_1: PredictionResult[];
  fase_2: PredictionResult[];
  fase_3: PredictionResult[];
} {
  const years = data.map((d) => Number(d.year));

  return {
    fase_1: predictPhase(data.map((d) => d.fase_1), years, yearsAhead) || [],
    fase_2: predictPhase(data.map((d) => d.fase_2), years, yearsAhead) || [],
    fase_3: predictPhase(data.map((d) => d.fase_3), years, yearsAhead) || [],
  };
}

/**
 * Carrega dados históricos de exames (medias por ano)
 */
export async function loadExamHistoryData(
  examNames: string[],
  years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  dataPath = '/data'
) {
  const result: {
    [examName: string]: { year: number; media_0_20: number; media_0_200: number }[];
  } = {};

  try {
    // Para cada ano, carrega medias_historicas_exames.json
    const examsByYear: {
      Ano: number;
      Exame_Unificado: string;
      Fase: number;
      Total_Alunos: number;
      Media_0_200: number;
      Media_0_20: number;
    }[] = [];

    for (const year of years) {
      try {
        const response = await fetch(`${dataPath}/medias_historicas_exames.json`);
        const data = await response.json();
        // Nota: este arquivo contém dados de TODOS os anos
        examsByYear.push(...data);
      } catch (err) {
        console.warn(`Erro ao carregar medias_historicas_exames.json para ${year}:`, err);
      }
    }

    // Agrupa por nome de exame e filtra pelos selecionados
    for (const examName of examNames) {
      result[examName] = [];
      const filtered = examsByYear
        .filter((e) => e.Exame_Unificado === examName && e.Fase === 1) // Apenas Fase 1
        .sort((a, b) => a.Ano - b.Ano);

      for (const entry of filtered) {
        result[examName].push({
          year: entry.Ano,
          media_0_20: entry.Media_0_20,
          media_0_200: entry.Media_0_200,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Erro ao carregar histórico de exames:', error);
    throw error;
  }
}
