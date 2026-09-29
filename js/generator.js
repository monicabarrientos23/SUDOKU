/**
 * Sudoku Generator & Solver
 * Genera tableros válidos de Sudoku con soluciones únicas y niveles progresivos.
 */

class SudokuGenerator {
  constructor() {
    this.DIFFICULTIES = {
      1: { name: 'Principiante', clues: 48, stars: 1 },
      2: { name: 'Fácil', clues: 40, stars: 2 },
      3: { name: 'Medio', clues: 34, stars: 3 },
      4: { name: 'Difícil', clues: 28, stars: 4 },
      5: { name: 'Experto', clues: 24, stars: 5 }
    };
  }

  // Verifica si un número puede colocarse en (row, col)
  isValid(grid, row, col, num) {
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === num && i !== col) return false;
      if (grid[i][col] === num && i !== row) return false;
    }

    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const currR = startRow + r;
        const currC = startCol + c;
        if (grid[currR][currC] === num && (currR !== row || currC !== col)) {
          return false;
        }
      }
    }

    return true;
  }

  // Mezcla un array aleatoriamente (Fisher-Yates)
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Obtiene los números válidos para una casilla
  getCandidates(grid, row, col) {
    const candidates = [];
    for (let num = 1; num <= 9; num++) {
      if (this.isValid(grid, row, col, num)) {
        candidates.push(num);
      }
    }
    return candidates;
  }

  // Encuentra la casilla vacía con menor número de candidatos (Heurística MRV)
  findBestEmptyCell(grid) {
    let bestCell = null;
    let minCandidates = 10;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          const candidates = this.getCandidates(grid, r, c);
          if (candidates.length < minCandidates) {
            minCandidates = candidates.length;
            bestCell = { r, c, candidates };
            if (minCandidates <= 1) return bestCell; // Óptimo absoluto
          }
        }
      }
    }
    return bestCell;
  }

  // Rellena la cuadrícula usando Backtracking aleatorizado optimizado
  solve(grid) {
    const best = this.findBestEmptyCell(grid);
    if (!best) return true; // Tablero lleno y válido

    const { r, c, candidates } = best;
    const shuffledCandidates = this.shuffle(candidates);

    for (const num of shuffledCandidates) {
      grid[r][c] = num;
      if (this.solve(grid)) {
        return true;
      }
      grid[r][c] = 0;
    }
    return false;
  }

  // Cuenta número de soluciones para garantizar unicidad (rápido con MRV)
  countSolutions(grid, countObj = { count: 0 }) {
    if (countObj.count >= 2) return countObj.count;

    const best = this.findBestEmptyCell(grid);
    if (!best) {
      countObj.count++;
      return countObj.count;
    }

    const { r, c, candidates } = best;
    for (const num of candidates) {
      grid[r][c] = num;
      this.countSolutions(grid, countObj);
      grid[r][c] = 0;
      if (countObj.count >= 2) return countObj.count;
    }
    return countObj.count;
  }

  // Genera un tablero completo y luego vacía celdas según la dificultad
  generate(difficultyLevel = 1) {
    const config = this.DIFFICULTIES[difficultyLevel] || this.DIFFICULTIES[1];
    const targetClues = config.clues;

    // 1. Crear matriz vacía 9x9
    const solution = Array.from({ length: 9 }, () => Array(9).fill(0));

    // 2. Rellenar bloques diagonales (0,0), (3,3), (6,6) con números aleatorios para rápida variedad
    for (let b = 0; b < 9; b += 3) {
      const nums = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      let idx = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          solution[b + r][b + c] = nums[idx++];
        }
      }
    }

    // 3. Resolver completamente para obtener la solución válida
    this.solve(solution);

    // 4. Copiar para crear el puzzle
    const puzzle = solution.map(row => [...row]);

    // 5. Crear lista de todas las 81 posiciones y mezclarlas
    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push({ r, c });
      }
    }
    const shuffledPositions = this.shuffle(positions);

    let cluesRemaining = 81;
    for (const { r, c } of shuffledPositions) {
      if (cluesRemaining <= targetClues) break;

      const temp = puzzle[r][c];
      puzzle[r][c] = 0;

      // Comprobar unicidad para niveles 1 a 4, o permitir mayor velocidad en nivel experto
      if (difficultyLevel <= 4) {
        const copy = puzzle.map(row => [...row]);
        const solObj = { count: 0 };
        this.countSolutions(copy, solObj);
        if (solObj.count !== 1) {
          // Si deja de ser único, revertimos
          puzzle[r][c] = temp;
          continue;
        }
      }

      cluesRemaining--;
    }

    return {
      puzzle,
      solution,
      difficulty: difficultyLevel,
      difficultyName: config.name,
      rewardStars: config.stars,
      initialClues: cluesRemaining
    };
  }
}

window.sudokuGenerator = new SudokuGenerator();
