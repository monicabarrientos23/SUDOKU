/**
 * Sudoku Game - App Controller
 * Orquesta la lógica del juego, renderizado, eventos, cronómetro,
 * bonificaciones de velocidad, efectos visuales y modales.
 */

class SudokuApp {
  constructor() {
    this.generator = window.sudokuGenerator;
    this.storage = window.storageManager;
    this.audio = window.soundEngine;

    // Estado del juego
    this.difficulty = 1;
    this.puzzle = [];     // Tablero inicial (valores fijos)
    this.current = [];    // Tablero actual del usuario
    this.solution = [];   // Solución completa
    this.notes = {};      // Notas/candidatos por celda 'r-c': Set(numbers)
    this.history = [];    // Pila para Deshacer (undo)

    this.selectedCell = null; // { r, c }
    this.isNotesMode = false;
    this.mistakes = 0;
    this.maxMistakes = 4;
    this.hintsRemaining = 3;

    // Seguimiento de filas, columnas y cajas completadas para efectos luminosos
    this.completedRows = new Set();
    this.completedCols = new Set();
    this.completedBoxes = new Set();

    // Bonificación de velocidad: completar todos los números de un dígito en < 1 minuto
    this.speedBonusAwarded = new Set();

    // Cronómetro
    this.timerInterval = null;
    this.elapsedSeconds = 0;
    this.isGameActive = false;

    // Inicializar interfaz
    this.cacheDOM();
    this.bindEvents();
    this.initApp();
  }

  cacheDOM() {
    // Header & Perfil
    this.domUserAvatar = document.getElementById('user-avatar');
    this.domUserName = document.getElementById('user-name');
    this.domUserStars = document.getElementById('user-stars');
    this.domBtnProfile = document.getElementById('btn-profile');
    this.domBtnSound = document.getElementById('btn-sound');
    this.domThemeSelect = document.getElementById('theme-select');

    // Barra de Estado
    this.domDifficulty = document.getElementById('difficulty-select');
    this.domTimer = document.getElementById('game-timer');
    this.domMistakes = document.getElementById('mistakes-display');
    this.domMistakesIcons = document.getElementById('mistakes-icons');
    this.domHintsCount = document.getElementById('hints-count');
    this.domBtnNewGame = document.getElementById('btn-new-game');

    // Tablero & Controles
    this.domBoard = document.getElementById('sudoku-board');
    this.domKeypad = document.getElementById('keypad');
    this.domBtnNotes = document.getElementById('btn-mode-notes');
    this.domBtnErase = document.getElementById('btn-action-erase');
    this.domBtnHint = document.getElementById('btn-action-hint');
    this.domBtnUndo = document.getElementById('btn-action-undo');

    // Modales
    this.domModalRegister = document.getElementById('modal-register');
    this.domFormRegister = document.getElementById('form-register');
    this.domInputName = document.getElementById('input-player-name');
    this.domAvatarOptions = document.querySelectorAll('.avatar-choice');

    this.domModalGameOver = document.getElementById('modal-gameover');
    this.domBtnRevive = document.getElementById('btn-revive');
    this.domBtnRestart = document.getElementById('btn-restart-game');
    this.domReviveCostText = document.getElementById('revive-cost-text');

    this.domModalVictory = document.getElementById('modal-victory');
    this.domVictoryStars = document.getElementById('victory-stars-earned');
    this.domVictoryTime = document.getElementById('victory-time');
    this.domVictoryMistakes = document.getElementById('victory-mistakes');
    this.domBtnNextLevel = document.getElementById('btn-next-level');

    this.domModalStats = document.getElementById('modal-stats');
    this.domStatsContent = document.getElementById('stats-modal-body');
    this.domBtnCloseStats = document.getElementById('btn-close-stats');

    // Notificaciones toast
    this.domToast = document.getElementById('toast-notification');
    this.domToastTitle = document.getElementById('toast-title');
    this.domToastDesc = document.getElementById('toast-desc');
  }

  initApp() {
    // Aplicar tema guardado
    const savedTheme = this.storage.getSavedTheme();
    document.body.className = savedTheme;
    if (this.domThemeSelect) this.domThemeSelect.value = savedTheme;

    // Sonido
    this.updateSoundIcon();

    // Comprobar si hay usuario registrado
    if (!this.storage.hasRegisteredUser()) {
      this.showRegisterModal();
    } else {
      this.loadUserProfile();
      this.startNewGame(1);
    }
  }

  loadUserProfile() {
    const profile = this.storage.getUserProfile();
    if (!profile) return;

    this.domUserAvatar.textContent = profile.avatar;
    this.domUserName.textContent = profile.name;
    this.domUserStars.textContent = profile.stars || 0;
  }

  showRegisterModal() {
    this.domModalRegister.classList.remove('hidden');
    let selectedAvatar = '🦊';

    this.domAvatarOptions.forEach(btn => {
      btn.addEventListener('click', () => {
        this.domAvatarOptions.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedAvatar = btn.dataset.avatar;
      });
    });

    this.domFormRegister.onsubmit = (e) => {
      e.preventDefault();
      const name = this.domInputName.value.trim() || 'Jugador';
      this.storage.registerUser(name, selectedAvatar);
      this.domModalRegister.classList.add('hidden');
      this.loadUserProfile();
      this.showToast('¡Bienvenido!', `Hola ${name}, te regalamos 4 ⭐ iniciales para comenzar.`);
      this.startNewGame(1);
    };
  }

  bindEvents() {
    // Selector de tema
    this.domThemeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      document.body.className = theme;
      this.storage.saveTheme(theme);
    });

    // Silenciar / Activar sonido
    this.domBtnSound.addEventListener('click', () => {
      this.audio.initContext();
      const isMuted = this.audio.toggleMute();
      this.updateSoundIcon(isMuted);
    });

    // Nuevo juego
    this.domBtnNewGame.addEventListener('click', () => {
      this.audio.playClick();
      this.startNewGame(parseInt(this.domDifficulty.value, 10));
    });

    // Cambio de dificultad
    this.domDifficulty.addEventListener('change', (e) => {
      this.audio.playClick();
      this.startNewGame(parseInt(e.target.value, 10));
    });

    // Botones de acción
    this.domBtnNotes.addEventListener('click', () => {
      this.audio.playPencilToggle();
      this.isNotesMode = !this.isNotesMode;
      this.domBtnNotes.classList.toggle('active', this.isNotesMode);
    });

    this.domBtnErase.addEventListener('click', () => {
      this.audio.playClick();
      this.eraseSelectedCell();
    });

    this.domBtnHint.addEventListener('click', () => {
      this.useHint();
    });

    this.domBtnUndo.addEventListener('click', () => {
      this.undoMove();
    });

    // Teclado en pantalla (Keypad 1-9)
    this.domKeypad.addEventListener('click', (e) => {
      const key = e.target.closest('.keypad-btn');
      if (!key) return;
      const num = parseInt(key.dataset.num, 10);
      if (num >= 1 && num <= 9) {
        this.inputNumber(num);
      }
    });

    // Teclado físico
    window.addEventListener('keydown', (e) => {
      this.handleKeyboard(e);
    });

    // Perfil / Estadísticas
    this.domBtnProfile.addEventListener('click', () => {
      this.showStatsModal();
    });
    this.domBtnCloseStats.addEventListener('click', () => {
      this.domModalStats.classList.add('hidden');
    });

    // Revivir o reiniciar
    this.domBtnRevive.addEventListener('click', () => {
      this.reviveGame();
    });
    this.domBtnRestart.addEventListener('click', () => {
      this.domModalGameOver.classList.add('hidden');
      this.startNewGame(this.difficulty);
    });

    // Siguiente nivel tras ganar
    this.domBtnNextLevel.addEventListener('click', () => {
      this.domModalVictory.classList.add('hidden');
      const nextDiff = Math.min(5, this.difficulty + 1);
      this.domDifficulty.value = nextDiff;
      this.startNewGame(nextDiff);
    });
  }

  updateSoundIcon(isMuted = this.audio.isMuted) {
    this.domBtnSound.innerHTML = isMuted
      ? '<span>🔇</span>'
      : '<span>🔊</span>';
  }

  // Iniciar una nueva partida
  startNewGame(difficultyLevel = 1) {
    this.difficulty = difficultyLevel;
    this.domDifficulty.value = difficultyLevel;

    // Reset de estado
    this.mistakes = 0;
    this.hintsRemaining = 3;
    this.speedBonusAwarded.clear();
    this.completedRows.clear();
    this.completedCols.clear();
    this.completedBoxes.clear();
    this.notes = {};
    this.history = [];
    this.selectedCell = null;
    this.isNotesMode = false;
    this.domBtnNotes.classList.remove('active');

    // Generar puzzle
    const generated = this.generator.generate(this.difficulty);
    this.puzzle = generated.puzzle;
    this.solution = generated.solution;
    this.current = this.puzzle.map(row => [...row]);

    this.updateMistakesDisplay();
    this.updateHintsDisplay();

    // Renderizar tablero
    this.renderBoard();
    this.updateKeypadBadges();

    // Iniciar cronómetro
    this.startTimer();
    this.isGameActive = true;
  }

  // Cronómetro
  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.elapsedSeconds = 0;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.updateTimerDisplay();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const min = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0');
    const sec = (this.elapsedSeconds % 60).toString().padStart(2, '0');
    this.domTimer.textContent = `${min}:${sec}`;
  }

  // Renderizado del tablero 9x9
  renderBoard() {
    this.domBoard.innerHTML = '';

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.dataset.box = Math.floor(r / 3) * 3 + Math.floor(c / 3);

        const val = this.current[r][c];
        const isGiven = this.puzzle[r][c] !== 0;

        if (isGiven) {
          cell.classList.add('given');
          cell.textContent = val;
        } else if (val !== 0) {
          cell.textContent = val;
        }

        cell.addEventListener('click', () => {
          this.selectCell(r, c);
        });

        this.domBoard.appendChild(cell);
      }
    }
  }

  // Selección de celda y resaltado inteligente
  selectCell(r, c) {
    this.selectedCell = { r, c };
    const selectedVal = this.current[r][c];
    const selectedBox = Math.floor(r / 3) * 3 + Math.floor(c / 3);

    const cells = this.domBoard.querySelectorAll('.sudoku-cell');
    cells.forEach(cell => {
      const cr = parseInt(cell.dataset.row, 10);
      const cc = parseInt(cell.dataset.col, 10);
      const cbox = parseInt(cell.dataset.box, 10);
      const cval = this.current[cr][cc];

      // Limpiar clases de selección previa
      cell.classList.remove('selected', 'highlighted', 'same-number');

      if (cr === r && cc === c) {
        cell.classList.add('selected');
      } else if (cr === r || cc === c || cbox === selectedBox) {
        cell.classList.add('highlighted');
      }

      if (selectedVal !== 0 && cval === selectedVal) {
        cell.classList.add('same-number');
      }
    });

    this.audio.playClick();
  }

  // Entrada de un número (1 al 9)
  inputNumber(num) {
    if (!this.isGameActive || !this.selectedCell) return;
    const { r, c } = this.selectedCell;

    // No se puede modificar una pista inicial
    if (this.puzzle[r][c] !== 0) return;

    if (this.isNotesMode) {
      this.toggleNote(r, c, num);
      return;
    }

    const key = `${r}-${c}`;
    const previousVal = this.current[r][c];
    const previousNotes = this.notes[key] ? new Set(this.notes[key]) : new Set();

    // Si ya tiene ese mismo número, no hacer nada
    if (previousVal === num) return;

    const correctVal = this.solution[r][c];

    if (num === correctVal) {
      // Movimiento correcto
      this.saveHistoryAction({
        type: 'place',
        r, c,
        oldVal: previousVal,
        newVal: num,
        oldNotes: previousNotes
      });

      this.current[r][c] = num;
      delete this.notes[key];

      this.updateCellDOM(r, c, num);
      this.audio.playNumberPlaced(num);

      // Limpiar notas del mismo número en la fila, col y caja
      this.clearConflictingNotes(r, c, num);

      // Comprobar logros luminosos (fila, columna, bloque 3x3)
      this.checkSectionCompletions(r, c);

      // Comprobar bonificación por completar todos los números de este dígito en < 1 min
      this.checkSpeedBonus(num);

      // Actualizar conteos del teclado
      this.updateKeypadBadges();

      // Refrescar resaltados
      this.selectCell(r, c);

      // Verificar si completó todo el Sudoku
      this.checkGameWon();
    } else {
      // Movimiento incorrecto
      this.mistakes++;
      this.audio.playError();
      this.triggerErrorVisual(r, c);
      this.updateMistakesDisplay();

      if (this.mistakes >= this.maxMistakes) {
        this.triggerGameOver();
      }
    }
  }

  // Alternar nota rápida (pencil mark)
  toggleNote(r, c, num) {
    const key = `${r}-${c}`;
    if (!this.notes[key]) this.notes[key] = new Set();

    const previousNotes = new Set(this.notes[key]);

    if (this.notes[key].has(num)) {
      this.notes[key].delete(num);
    } else {
      this.notes[key].add(num);
    }

    this.saveHistoryAction({
      type: 'note',
      r, c,
      oldNotes: previousNotes,
      newNotes: new Set(this.notes[key])
    });

    this.renderNotesInCell(r, c);
    this.audio.playPencilToggle();
  }

  // Renderizar notas en la celda
  renderNotesInCell(r, c) {
    const cell = this.getCellDOM(r, c);
    if (!cell) return;

    const key = `${r}-${c}`;
    const cellNotes = this.notes[key];

    if (!cellNotes || cellNotes.size === 0) {
      cell.innerHTML = '';
      return;
    }

    let notesGrid = cell.querySelector('.notes-grid');
    if (!notesGrid) {
      cell.innerHTML = '<div class="notes-grid"></div>';
      notesGrid = cell.querySelector('.notes-grid');
    } else {
      notesGrid.innerHTML = '';
    }

    for (let i = 1; i <= 9; i++) {
      const noteItem = document.createElement('span');
      noteItem.className = 'note-num';
      noteItem.textContent = cellNotes.has(i) ? i : '';
      notesGrid.appendChild(noteItem);
    }
  }

  // Eliminar contenido o notas de la celda seleccionada
  eraseSelectedCell() {
    if (!this.isGameActive || !this.selectedCell) return;
    const { r, c } = this.selectedCell;

    if (this.puzzle[r][c] !== 0) return;

    const key = `${r}-${c}`;
    const oldVal = this.current[r][c];
    const oldNotes = this.notes[key] ? new Set(this.notes[key]) : new Set();

    if (oldVal === 0 && oldNotes.size === 0) return;

    this.saveHistoryAction({
      type: 'erase',
      r, c,
      oldVal,
      oldNotes
    });

    this.current[r][c] = 0;
    delete this.notes[key];

    const cell = this.getCellDOM(r, c);
    cell.textContent = '';
    cell.classList.remove('error');

    this.updateKeypadBadges();
    this.selectCell(r, c);
  }

  // Usar una pista (Help/Hint)
  useHint() {
    if (!this.isGameActive) return;
    if (this.hintsRemaining <= 0) {
      this.showToast('Sin ayudas', 'No te quedan pistas disponibles. ¡Completa números en < 1 min para ganar más!');
      return;
    }

    // Buscar una casilla vacía o con error
    let target = null;
    if (this.selectedCell && this.puzzle[this.selectedCell.r][this.selectedCell.c] === 0 && this.current[this.selectedCell.r][this.selectedCell.c] !== this.solution[this.selectedCell.r][this.selectedCell.c]) {
      target = this.selectedCell;
    } else {
      // Buscar la primera vacía
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (this.current[r][c] === 0) {
            target = { r, c };
            break;
          }
        }
        if (target) break;
      }
    }

    if (!target) return;

    this.hintsRemaining--;
    this.updateHintsDisplay();

    const { r, c } = target;
    const solVal = this.solution[r][c];

    this.current[r][c] = solVal;
    delete this.notes[`${r}-${c}`];

    const cell = this.getCellDOM(r, c);
    cell.textContent = solVal;
    cell.classList.add('hint-revealed');
    setTimeout(() => cell.classList.remove('hint-revealed'), 1200);

    this.audio.playNumberPlaced(solVal);
    this.clearConflictingNotes(r, c, solVal);
    this.checkSectionCompletions(r, c);
    this.checkSpeedBonus(solVal);
    this.updateKeypadBadges();
    this.selectCell(r, c);
    this.checkGameWon();
  }

  // Guardar acción para Deshacer
  saveHistoryAction(action) {
    this.history.push(action);
    if (this.history.length > 30) this.history.shift();
  }

  // Deshacer última jugada
  undoMove() {
    if (!this.isGameActive || this.history.length === 0) return;
    const action = this.history.pop();
    const { r, c } = action;
    const key = `${r}-${c}`;

    if (action.type === 'place') {
      this.current[r][c] = action.oldVal;
      if (action.oldNotes && action.oldNotes.size > 0) {
        this.notes[key] = new Set(action.oldNotes);
        this.renderNotesInCell(r, c);
      } else {
        const cell = this.getCellDOM(r, c);
        cell.textContent = action.oldVal !== 0 ? action.oldVal : '';
      }
    } else if (action.type === 'note') {
      this.notes[key] = new Set(action.oldNotes);
      this.renderNotesInCell(r, c);
    } else if (action.type === 'erase') {
      this.current[r][c] = action.oldVal;
      if (action.oldVal !== 0) {
        const cell = this.getCellDOM(r, c);
        cell.textContent = action.oldVal;
      }
      if (action.oldNotes && action.oldNotes.size > 0) {
        this.notes[key] = new Set(action.oldNotes);
        this.renderNotesInCell(r, c);
      }
    }

    this.audio.playClick();
    this.updateKeypadBadges();
    this.selectCell(r, c);
  }

  // Eliminar notas obsoletas tras colocar un número correcto
  clearConflictingNotes(row, col, num) {
    const boxR = Math.floor(row / 3) * 3;
    const boxC = Math.floor(col / 3) * 3;

    for (let i = 0; i < 9; i++) {
      // Fila
      const rowKey = `${row}-${i}`;
      if (this.notes[rowKey] && this.notes[rowKey].has(num)) {
        this.notes[rowKey].delete(num);
        this.renderNotesInCell(row, i);
      }
      // Columna
      const colKey = `${i}-${col}`;
      if (this.notes[colKey] && this.notes[colKey].has(num)) {
        this.notes[colKey].delete(num);
        this.renderNotesInCell(i, col);
      }
    }

    // Cuadrante 3x3
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const key = `${boxR + r}-${boxC + c}`;
        if (this.notes[key] && this.notes[key].has(num)) {
          this.notes[key].delete(num);
          this.renderNotesInCell(boxR + r, boxC + c);
        }
      }
    }
  }

  // Verificación de efectos luminosos (filas, columnas, recuadros)
  checkSectionCompletions(r, c) {
    // 1. Verificar Fila
    if (!this.completedRows.has(r)) {
      let rowComplete = true;
      for (let i = 0; i < 9; i++) {
        if (this.current[r][i] !== this.solution[r][i]) {
          rowComplete = false;
          break;
        }
      }
      if (rowComplete) {
        this.completedRows.add(r);
        this.triggerRowGlow(r);
        this.audio.playRowComplete();
      }
    }

    // 2. Verificar Columna
    if (!this.completedCols.has(c)) {
      let colComplete = true;
      for (let i = 0; i < 9; i++) {
        if (this.current[i][c] !== this.solution[i][c]) {
          colComplete = false;
          break;
        }
      }
      if (colComplete) {
        this.completedCols.add(c);
        this.triggerColGlow(c);
        this.audio.playColComplete();
      }
    }

    // 3. Verificar Bloque 3x3
    const boxIdx = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    if (!this.completedBoxes.has(boxIdx)) {
      let boxComplete = true;
      const startR = Math.floor(r / 3) * 3;
      const startC = Math.floor(c / 3) * 3;
      for (let br = 0; br < 3; br++) {
        for (let bc = 0; bc < 3; bc++) {
          if (this.current[startR + br][startC + bc] !== this.solution[startR + br][startC + bc]) {
            boxComplete = false;
            break;
          }
        }
        if (!boxComplete) break;
      }
      if (boxComplete) {
        this.completedBoxes.add(boxIdx);
        this.triggerBoxGlow(boxIdx);
        this.audio.playBoxComplete();
      }
    }
  }

  // Bonificación por completar todos los números de un dígito en < 1 minuto
  checkSpeedBonus(num) {
    if (this.speedBonusAwarded.has(num)) return;

    // Contar cuántas instancias correctas del número 'num' hay en el tablero
    let count = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.current[r][c] === num && this.current[r][c] === this.solution[r][c]) {
          count++;
        }
      }
    }

    if (count === 9) {
      if (this.elapsedSeconds <= 60) {
        this.speedBonusAwarded.add(num);
        this.hintsRemaining++;
        this.updateHintsDisplay();
        this.audio.playSpeedBonus();
        this.showToast(
          '⚡ ¡Velocidad Imparable!',
          `¡Completaste todos los [${num}] en solo ${this.elapsedSeconds}s (< 1 min)! +1 Ayuda ganada.`
        );
      }
    }
  }

  // Disparar destello luminoso en fila
  triggerRowGlow(r) {
    for (let c = 0; c < 9; c++) {
      const cell = this.getCellDOM(r, c);
      if (cell) {
        cell.classList.remove('glow-row');
        void cell.offsetWidth; // Reflow para reiniciar animación
        cell.classList.add('glow-row');
        setTimeout(() => cell.classList.remove('glow-row'), 1200);
      }
    }
  }

  // Disparar destello luminoso en columna
  triggerColGlow(c) {
    for (let r = 0; r < 9; r++) {
      const cell = this.getCellDOM(r, c);
      if (cell) {
        cell.classList.remove('glow-col');
        void cell.offsetWidth;
        cell.classList.add('glow-col');
        setTimeout(() => cell.classList.remove('glow-col'), 1200);
      }
    }
  }

  // Disparar destello luminoso en recuadro 3x3
  triggerBoxGlow(boxIdx) {
    const startR = Math.floor(boxIdx / 3) * 3;
    const startC = (boxIdx % 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cell = this.getCellDOM(startR + r, startC + c);
        if (cell) {
          cell.classList.remove('glow-box');
          void cell.offsetWidth;
          cell.classList.add('glow-box');
          setTimeout(() => cell.classList.remove('glow-box'), 1400);
        }
      }
    }
  }

  // Disparar destello luminoso total de victoria
  triggerBoardVictoryGlow() {
    const cells = this.domBoard.querySelectorAll('.sudoku-cell');
    cells.forEach((cell, idx) => {
      setTimeout(() => {
        cell.classList.add('glow-board-victory');
      }, (idx % 9) * 40 + Math.floor(idx / 9) * 30);
    });
  }

  // Visual de error
  triggerErrorVisual(r, c) {
    const cell = this.getCellDOM(r, c);
    if (!cell) return;
    cell.classList.add('error-shake');
    setTimeout(() => {
      cell.classList.remove('error-shake');
    }, 600);
  }

  // Game Over al llegar a 4 fallas
  triggerGameOver() {
    this.isGameActive = false;
    this.stopTimer();
    this.audio.playGameOver();
    this.storage.recordDefeat();

    const profile = this.storage.getUserProfile();
    const currentStars = profile ? profile.stars : 0;
    const reviveCost = 2;

    this.domModalGameOver.classList.remove('hidden');
    if (currentStars >= reviveCost) {
      this.domBtnRevive.disabled = false;
      this.domReviveCostText.textContent = `Tienes ${currentStars} ⭐. Usar 2 ⭐ para continuar`;
    } else {
      this.domBtnRevive.disabled = true;
      this.domReviveCostText.textContent = `Tienes ${currentStars} ⭐ (necesitas 2 ⭐ para continuar)`;
    }
  }

  // Revivir usando estrellas
  reviveGame() {
    const success = this.storage.deductStars(2);
    if (success) {
      this.audio.playRevive();
      this.mistakes = 1; // Le deja 3 oportunidades más (1/4)
      this.updateMistakesDisplay();
      this.loadUserProfile();
      this.domModalGameOver.classList.add('hidden');
      this.isGameActive = true;
      // Reanudar cronómetro
      this.timerInterval = setInterval(() => {
        this.elapsedSeconds++;
        this.updateTimerDisplay();
      }, 1000);

      this.showToast('✨ ¡Revivido con Éxito!', 'Se descontaron 2 ⭐. Tus fallas ahora son 1/4. ¡A por la victoria!');
    }
  }

  // Comprobar victoria
  checkGameWon() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.current[r][c] !== this.solution[r][c]) {
          return false;
        }
      }
    }

    // ¡Victoria!
    this.isGameActive = false;
    this.stopTimer();
    this.triggerBoardVictoryGlow();
    this.audio.playVictory();

    // Cálculo de estrellas
    const baseStars = this.difficulty;
    const bonusZeroMistakes = this.mistakes === 0 ? 1 : 0;
    const totalEarned = baseStars + bonusZeroMistakes;

    this.storage.addStars(totalEarned);
    this.storage.recordVictory(this.difficulty, this.elapsedSeconds);
    this.loadUserProfile();

    // Mostrar modal victoria
    setTimeout(() => {
      const min = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0');
      const sec = (this.elapsedSeconds % 60).toString().padStart(2, '0');

      let starString = '⭐'.repeat(totalEarned);
      if (bonusZeroMistakes) starString += ' (¡+1 Extra sin fallas!)';

      this.domVictoryStars.textContent = starString;
      this.domVictoryTime.textContent = `${min}:${sec}`;
      this.domVictoryMistakes.textContent = `${this.mistakes} / 4`;

      this.domModalVictory.classList.remove('hidden');
    }, 1500);

    return true;
  }

  // Teclado físico
  handleKeyboard(e) {
    if (!this.isGameActive) return;

    if (e.key >= '1' && e.key <= '9') {
      this.inputNumber(parseInt(e.key, 10));
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      this.eraseSelectedCell();
      return;
    }

    if (e.key.toLowerCase() === 'n') {
      this.audio.playPencilToggle();
      this.isNotesMode = !this.isNotesMode;
      this.domBtnNotes.classList.toggle('active', this.isNotesMode);
      return;
    }

    if (e.key.toLowerCase() === 'h') {
      this.useHint();
      return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      this.undoMove();
      return;
    }

    // Flechas de dirección
    if (this.selectedCell) {
      let { r, c } = this.selectedCell;
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        r = Math.max(0, r - 1);
        this.selectCell(r, c);
      } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        r = Math.min(8, r + 1);
        this.selectCell(r, c);
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        c = Math.max(0, c - 1);
        this.selectCell(r, c);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        c = Math.min(8, c + 1);
        this.selectCell(r, c);
      }
    }
  }

  // Actualizar indicadores visuales
  updateMistakesDisplay() {
    this.domMistakes.textContent = `${this.mistakes} / ${this.maxMistakes}`;
    const icons = [];
    for (let i = 0; i < this.maxMistakes; i++) {
      if (i < this.mistakes) {
        icons.push('<span class="heart-lost">❌</span>');
      } else {
        icons.push('<span class="heart-alive">❤️</span>');
      }
    }
    this.domMistakesIcons.innerHTML = icons.join('');
  }

  updateHintsDisplay() {
    this.domHintsCount.textContent = this.hintsRemaining;
  }

  // Actualiza los badges de números restantes en el keypad (1 a 9)
  updateKeypadBadges() {
    const counts = {};
    for (let i = 1; i <= 9; i++) counts[i] = 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = this.current[r][c];
        if (val >= 1 && val <= 9 && val === this.solution[r][c]) {
          counts[val]++;
        }
      }
    }

    const keyBtns = this.domKeypad.querySelectorAll('.keypad-btn');
    keyBtns.forEach(btn => {
      const num = parseInt(btn.dataset.num, 10);
      const remaining = 9 - (counts[num] || 0);
      const badge = btn.querySelector('.badge');
      if (badge) {
        badge.textContent = remaining > 0 ? remaining : '✓';
      }
      if (remaining <= 0) {
        btn.classList.add('completed');
      } else {
        btn.classList.remove('completed');
      }
    });
  }

  updateCellDOM(r, c, val) {
    const cell = this.getCellDOM(r, c);
    if (!cell) return;
    cell.textContent = val;
    cell.classList.remove('error');
  }

  getCellDOM(r, c) {
    return this.domBoard.querySelector(`.sudoku-cell[data-row="${r}"][data-col="${c}"]`);
  }

  showToast(title, desc) {
    this.domToastTitle.textContent = title;
    this.domToastDesc.textContent = desc;
    this.domToast.classList.add('show');
    setTimeout(() => {
      this.domToast.classList.remove('show');
    }, 4000);
  }

  showStatsModal() {
    const profile = this.storage.getUserProfile();
    if (!profile) return;

    const diffNames = {
      1: 'Principiante',
      2: 'Fácil',
      3: 'Medio',
      4: 'Difícil',
      5: 'Experto'
    };

    let bestTimesHtml = '';
    for (let d = 1; d <= 5; d++) {
      const t = profile.bestTimes ? profile.bestTimes[d] : null;
      let timeStr = 'Sin registro';
      if (t !== null && t !== undefined) {
        const m = Math.floor(t / 60).toString().padStart(2, '0');
        const s = (t % 60).toString().padStart(2, '0');
        timeStr = `${m}:${s}`;
      }
      bestTimesHtml += `
        <div class="stat-row">
          <span>${diffNames[d]}:</span>
          <strong>${timeStr}</strong>
        </div>
      `;
    }

    this.domStatsContent.innerHTML = `
      <div class="profile-header-modal">
        <div class="avatar-large">${profile.avatar}</div>
        <h3>${profile.name}</h3>
        <p class="stars-badge-modal">⭐ ${profile.stars} Estrellas acumuladas</p>
      </div>
      <hr />
      <div class="stats-summary">
        <div class="stat-card">
          <span class="stat-val">${profile.gamesPlayed || 0}</span>
          <span class="stat-lbl">Partidas</span>
        </div>
        <div class="stat-card">
          <span class="stat-val">${profile.gamesWon || 0}</span>
          <span class="stat-lbl">Victorias</span>
        </div>
        <div class="stat-card">
          <span class="stat-val">${profile.gamesPlayed ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100) : 0}%</span>
          <span class="stat-lbl">Tasa Victoria</span>
        </div>
      </div>
      <h4>Mejores Tiempos:</h4>
      <div class="best-times-list">${bestTimesHtml}</div>
    `;

    this.domModalStats.classList.remove('hidden');
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SudokuApp();
});
