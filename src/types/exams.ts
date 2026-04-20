/**
 * Representa uma opção de prova de ingresso com código e nome
 */
export interface ExamOption {
  code: string;
  name: string;
}

/**
 * Representa um grupo de opções alternativas (separadas por 'ou')
 * Exemplo: uma posição pode ter múltiplas escolhas ["Português", "Matemática"]
 */
export interface ExamAlternatives {
  options: ExamOption[];
}

/**
 * Representa uma posição/requisito de provas de ingresso
 * Pode ser uma opção única ou um grupo de alternativas
 */
export type ExamPosition = ExamOption | ExamAlternatives;

/**
 * Detalhes de um curso com informações de provas de ingresso
 */
export interface CourseDetails {
  codigo_instituicao: string;
  codigo_curso: string;
  curso: string;
  url: string;
  provas_ingresso: ExamPosition[];
  formula_nota: string | null;
}

/**
 * Dados de candidatura de uma fase específica
 */
export interface PhaseData {
  nota: number | null;
  vagas_sobrantes: number;
}

/**
 * Dados agregados de um curso para um ano específico
 */
export interface CourseYearData {
  codigo_instituicao: string;
  codigo_curso: string;
  instituicao: string;
  curso: string;
  grau: string;
  fases: {
    fase_1: PhaseData;
    fase_2: PhaseData;
    fase_3: PhaseData;
  };
}

/**
 * Tipos de dados disponíveis
 */
export enum DataType {
  COURSE_DETAILS = 'courseDetails',
  COURSE_YEAR_DATA = 'courseYearData',
}

/**
 * Configuração de carregamento de dados
 */
export interface DataLoadConfig {
  courseDetailsPath?: string;
  dataPath?: string;
}
