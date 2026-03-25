# 📊 Calculadora de Provas de Ingresso - Implementação

## Resumo da Implementação

Criei um sistema completo para carregar e exibir as provas de ingresso reais do JSON, mostrando claramente:
- Provas obrigatórias
- Opções alternativas (com "ou")
- Fórmula de cálculo da média de entrada
- Interface interativa para selecionar a melhor opção

---

## 🎯 Componentes Criados

### 1. **Hook: `useCourseDetailsById`**
- **Localização:** `src/hooks/useCourseDetailsById.js`
- **Função:** Carrega detalhes de um curso específico pelo código

```javascript
const { course, loading, error } = useCourseDetailsById(
  '300',      // código instituição
  '9813'      // código curso
)
```

**Retorna:**
- `course` - Objeto completo do curso com provas e fórmula
- `loading` - Estado de carregamento
- `error` - Mensagem de erro (se houver)

---

### 2. **Componente: `AdmissionCalculator`**
- **Localização:** `src/components/AdmissionCalculator/`
- **Ficheiros:**
  - `AdmissionCalculator.jsx` - Componente React
  - `AdmissionCalculator.module.css` - Estilos

**Funcionalidades:**

#### a) **Exibição da Fórmula de Cálculo**
```
Fórmula de Cálculo:
"Média do secundário: 50% | Provas de ingresso: 50%"
```

#### b) **Listagem de Provas**
Para cada prova agrupada:
- Se é **obrigatória** → mostrada diretamente com badge "Obrigatória"
- Se tem **"ou"** → apresenta radio buttons para escolher a melhor opção

**Exemplo visual:**
```
┌─ Escolha 1 de 3 opções ────────────┐
│ ○ 18  Português                    │
│ ○ 17  Mat. Apl. Ciências Soc.      │ ← Selecionada por padrão
│ ○ 09  Geografia                    │
└────────────────────────────────────┘
```

#### c) **Resumo de Seleções**
Mostra um resumo visual das provas escolhidas:
```
┌─ Resumo das Provas Selecionadas ───┐
│ 18  Português                      │
│ 17  Mat. Apl. Ciências Soc. [Alt.] │
│ 18  Português                      │
└────────────────────────────────────┘
```

#### d) **Dica Interativa**
"Ao selecionar 'ou', escolha o exame onde tem melhor classificação para maximizar sua média de entrada."

---

## 📊 Como os Dados São Estruturados

### Dados do JSON (`cursos_detalhes.json`)
```json
{
  "codigo_instituicao": "9002",
  "codigo_curso": "0300",
  "provas_ingresso": [
    "18  Português",
    "ou",
    "17  Mat. Apl. Ciências Soc.",
    "ou",
    "09  Geografia",
    "18  Português",
    "ou",
    "17  Mat. Apl. Ciências Soc.",
    "18  Português",
    "ou",
    "04  Economia",
    "18  Português"
  ],
  "formula_nota": "Média do secundário: 50% | Provas de ingresso: 50%"
}
```

### Após Processamento (Via `parseProvasIngresso`)
```javascript
[
  {
    options: [
      { code: "18", name: "Português" },
      { code: "17", name: "Mat. Apl. Ciências Soc." },
      { code: "09", name: "Geografia" }
    ]
  },
  {
    options: [
      { code: "18", name: "Português" },
      { code: "17", name: "Mat. Apl. Ciências Soc." }
    ]
  },
  // ... mais posições
  { code: "18", name: "Português" }  // Obrigatória
]
```

---

## 🎨 Interface Visual

```
┌─────────────────────────────────────────┐
│ Provas de Ingresso Obrigatórias         │
├─────────────────────────────────────────┤
│ Fórmula de Cálculo:                     │
│ ┌─────────────────────────────────────┐ │
│ │ Média do secundário: 50%             │ │
│ │ Provas de ingresso: 50%              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ Escolha 1 de 3 opções ──────────┐  │
│ │ ● 18  Português                  │  │
│ │ ○ 17  Mat. Apl. Ciências Soc.    │  │
│ │ ○ 09  Geografia                  │  │
│ └──────────────────────────────────┘  │
│                                         │
│ ┌─ Resumo das Provas Selecionadas ─┐  │
│ │ ✓ 18  Português                  │  │
│ │ ✓ 17  Mat. Apl. [Alternativa]    │  │
│ │ ✓ 18  Português                  │  │
│ └──────────────────────────────────┘  │
│                                         │
│ 💡 Dica: Escolha o exame onde tem  │  │
│    melhor classificação...             │
│                                         │
│ [Simulador de Candidatura]             │
└─────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados

```
CourseDetail.jsx
    ↓
useCourseDetailsById('300', '9813')
    ↓
loadCourseDetails() [Service]
    ↓
parseProvasIngresso() [Service]
    ↓
AdmissionCalculator Component
    ├─ Renderiza fórmula
    ├─ Renderiza provas com radio buttons
    ├─ Renderiza resumo de seleções
    └─ Renderiza dica
```

---

## 🎯 Estados Visuais

### 1. **Carregando**
```
Carregando informações do curso...
```

### 2. **Erro**
```
Erro: Curso não encontrado: 300-9813
```

### 3. **Sem Dados**
```
Sem provas de ingresso definidas
```

### 4. **Sucesso** (Normal)
Exibe estrutura completa com fórmula, provas e resumo

---

## 🎯 Seleção Interativa

```javascript
// Quando o utilizador clica numa opção:
handleExamSelection(positionIdx, optionIdx)

// O estado é atualizado:
setSelected({ ...prev, [positionIdx]: optionIdx })

// E a interface reflete a escolha:
- ● Radio button selecionado
- Fundo azul no card
- Resumo atualizado
```

---

## 📦 Ficheiros Modificados/Criados

| Ficheiro | Tipo | Descrição |
|----------|------|-----------|
| `src/hooks/useCourseDetailsById.js` | Novo | Hook para carregar curso |
| `src/components/AdmissionCalculator/AdmissionCalculator.jsx` | Novo | Componente principal |
| `src/components/AdmissionCalculator/AdmissionCalculator.module.css` | Novo | Estilos |
| `src/components/CourseDetail/CourseDetail.jsx` | Modificado | Integração do novo componente |

---

## ✅ Funcionalidades

- ✅ Carrega dados reais do JSON
- ✅ Processa opções separadas por "ou"
- ✅ Mostra fórmula de cálculo
- ✅ Interface interativa com radio buttons
- ✅ Resumo de seleções
- ✅ Tratamento de erros e carregamento
- ✅ Responsivo e acessível
- ✅ Sem erros de compilação

---

## 🚀 Como Usar em Outros Cursos

```jsx
// Para um curso diferente:
const { course, loading, error } = useCourseDetailsById(
  '9001',    // novo código instituição
  '5000'     // novo código curso
)

<AdmissionCalculator 
  course={course}
  isLoading={loading}
  error={error}
/>
```

---

## 📌 Exemplo Real - Medicina

Para o curso de Medicina (instituição: 300, curso: 9813):
- ✅ Carrega provas do JSON
- ✅ Processa grupos de opções
- ✅ Permite selecionar melhor opção
- ✅ Mostra resumo com as escolhas selecionadas

Todos os dados vêm diretamente do JSON, sem dados mocados! 🎯
