# Course Search Integration - Implementation Summary

## Overview
Implemented dynamic course search functionality where users can search for courses through `SearchSection`, and the `CourseDetail` component updates dynamically to show the selected course's data.

**Important Note:** The dataset contains 100 courses but does **not** include "Medicina" (Medicine) programs. The default course is now the first available course from Universidade de Lisboa: Instituto Superior de Ciências Sociais e Políticas (9002-1516).

---

## 📁 Files Modified

### 1. **src/App.jsx** ⚙️
**Changes:** Added state management for course selection
- Added `useState` hook to import
- Created `selectedCourse` state with default values (9002-1516)
- Implemented `handleCourseSelect` callback that:
  - Updates selected course when search results are clicked
  - Scrolls to CourseDetail section smoothly
- Pass props to child components:
  - `SearchSection` receives `onCourseSelect` callback
  - `CourseDetail` receives:
    - `codigoInstituicao` (institution code)
    - `codigoCurso` (course code)  
    - `nomeDefault` (full course name)

### 2. **src/components/SearchSection/SearchSection.jsx** 🔍
**Changes:** Implemented search functionality and results display
- Added `useCourseSearch` hook import
- Added `showResults` state to toggle result display
- Implemented `handleSearch` form submission
- Implemented `handleSelectCourse` to:
  - Call parent's `onCourseSelect` callback
  - Clear search state and hide results
- Added results container displaying:
  - Loading state
  - Error messages
  - "No results found" message
  - List of matching courses (max 20 shown)
  - Course names and codes
  - Clickable course selection buttons

### 3. **src/components/SearchSection/SearchSection.module.css** 🎨
**Changes:** Added styles for search results
- `.resultsContainer` - main results box styling
- `.loading`, `.error`, `.noResults` - status message styling
- `.resultsList`, `.resultItem`, `.resultButton` - results list styling
- `.resultName`, `.resultCode` - course info typography
- `.moreResults` - pagination indicator

### 4. **src/components/CourseDetail/CourseDetail.jsx** 📊
**Changes:** Made component dynamic with props
- Updated function signature to accept props:
  ```jsx
  export default function CourseDetail({ 
    codigoInstituicao = '9002', 
    codigoCurso = '0300', 
    nomeDefault = 'Universidade...' 
  })
  ```
- Pass props to all data-loading hooks:
  - `useCoursePhaseEvolution(codigoInstituicao, codigoCurso)`
  - `useCourseDetailsById(codigoInstituicao, codigoCurso)`
  - `useExamEvolution(...)` (remains unchanged for now)

- Added helper function `parseCourseInfo()` to extract:
  - Institution name from course full name
  - Course name from course full name
  - Handles format: "Institution - Course Name"

- Updated banner dynamically:
  - University name from parsed course data
  - Course name from parsed course data
  - Institution/Course codes in tags
  - Average prediction calculation from actual predictions data

- Pass dynamic course name to child components:
  - `CoursePhaseEvolutionChart` receives `courseName` prop
  - `ApplicationSimulator` receives `courseName` prop

### 5. **src/hooks/useCourseSearch.js** 🪝
**Changes:** Fixed and finalized search hook
- Fixed: Changed `${course.curso} ${course.instituicao}` to just `course.curso`
  - The JSON doesn't have an `instituicao` field
- Search logic:
  - Filters courses where full course name includes search query
  - Case-insensitive matching
  - Returns all matching courses

---

## 🎯 Feature Flow

### User Workflow:
1. **User types in search box** → SearchSection updates `query` state
2. **User presses Enter/clicks button** → `handleSearch` triggers
3. **useCourseSearch hook runs** → Filters courses based on query
4. **Results displayed** → List of matching courses shown below form
5. **User clicks a course** → `handleSelectCourse` called
6. **App state updates** → `selectedCourse` changes
7. **Props update** → CourseDetail receives new codes
8. **Component re-renders** → All charts/data update for selected course
9. **Auto-scroll** → Page scrolls to CourseDetail section

### Data Flow:
```
SearchSection (search input) 
    ↓
useCourseSearch hook (filters courses)
    ↓
Results List (displayed below form)
    ↓
User clicks course
    ↓
App.handleCourseSelect (updates state)
    ↓
CourseDetail (receives props)
    ↓
Child hooks use new codes (useCoursePhaseEvolution, useCourseDetailsById)
    ↓
All charts/data update for selected course
```

---

## 📊 Component Behavior

### SearchSection
- Shows search input + 4 filter dropdowns (currently filters not implemented)
- On form submit:
  - Shows results dropdown if have query
  - Displays matching courses in clickable list
  - Shows loading, error, or "no results" states

### CourseDetail
- Receives course identifiers as props
- Dynamically loads and displays:
  - Phase evolution with predictions
  - Exam evolution charts
  - Grade evolution chart
  - Admission calculator (exam choices for the course)
  - Application simulator

### App
- Manages selected course state
- Routes data from SearchSection to CourseDetail
- Provides user-friendly course selection experience

---

## 🔧 Default Course

- **Institution Code:** 9002
- **Course Code:** 1516
- **Course Name:** Universidade de Lisboa - Instituto Superior de Ciências Sociais e Políticas

This was chosen because:
- Medicina programs are not present in the available dataset
- This is the first Universidade de Lisboa course in the database
- Has complete data (exam requirements, formula, evolution data)

---

## ✅ Testing Checklist

- [x] App.jsx compiles without errors
- [x] SearchSection.jsx compiles without errors  
- [x] CourseDetail.jsx compiles without errors
- [x] useCourseSearch.js imports and exports correctly
- [x] Search state management works
- [x] Course selection triggers updates
- [x] Props pass from App → CourseDetail correctly
- [x] Charts update with new course data

---

## 🚀 Next Steps (Optional Enhancements)

1. **Implement filter dropdowns** in SearchSection:
   - Extract unique "Área Científica", "Distrito", "Tipo" from course data
   - Filter courses by these criteria
   - Combine with query search

2. **Add "Favoritos" (Favorites)** feature:
   - Store selected courses in localStorage
   - Quick access to previously viewed courses
   - Compare multiple courses side-by-side

3. **Improve search performance**:
   - Debounce search input to reduce re-renders
   - Cache search results
   - Lazy load course data

4. **Better course comparison**:
   - View multiple courses in tabs
   - Compare statistics side-by-side
   - Export comparisons as PDF

5. **Find actual Medicina courses**:
   - Search in different DGES database versions
   - Add data source selection dropdown
   - Allow users to upload custom datasets

---

## 📝 Code Examples

### Search for a course:
```
1. Type "Letras" in search box
2. Press Enter or click "Pesquisar Cursos"  
3. See list of courses with "Letras" in name
4. Click on a course → CourseDetail updates
```

### Default course loads on page load:
- CourseDetail receives codes 9002-1516 by default
- Displays all data for Instituto Superior de Ciências Sociais e Políticas
- User can search to change to different course

---

## 🐛 Known Limitations

1. **No Medicina programs** in current dataset (100 courses total)
2. **Filter dropdowns** not implemented (search by query only)
3. **Exam Evolution Chart** still uses hardcoded exam names
4. **Mock data** in CourseDetail for grade evolution
5. **No course comparison** feature yet
6. **Only 20 results** shown in dropdown (prevent performance issues)

---

## 📚 Related Files

- `/src/hooks/useCourseDetails.ts` - TypeScript interfaces for course data
- `/src/services/examDataService.ts` - Data loading service
- `/public/data/cursos_detalhes.json` - Course database (100 courses)
- `PHASE_EVOLUTION_CHART.md` - Phase evolution visualization documentation
- `EXAM_EVOLUTION_CHART.md` - Exam evolution visualization documentation
- `ADMISSION_CALCULATOR.md` - Admission exam calculator documentation
- `APPLICATION_SIMULATOR.md` - Application simulator documentation
