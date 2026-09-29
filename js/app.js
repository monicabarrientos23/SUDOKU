/**
 * Sudoku Game - App Controller
 * Orquesta la lógica del juego, renderizado, eventos, cronómetro,
 * bonificaciones de velocidad, efectos visuales, autenticación y multijugador en tiempo real.
 */

class SudokuApp {
  constructor() {
    this.generator = window.sudokuGenerator;
    this.storage = window.storageManager;
    this.audio = window.soundEngine;
    this.multiplayer = window.multiplayerManager;

    // Modos de juego
    this.gameMode = 'solo'; // 'solo' | 'multiplayer'
    this.currentSeed = null;

    // Estado de la partida
    this.difficulty = 1;
    this.puzzle = [];     // Tablero inicial
    this.current = [];    // Tablero actual del usuario
    this.solution = [];   // Solución completa
    this.notes = {};      // Notas/candidatos por celda 'r-c': Set(numbers)
    this.history = [];    // Pila para Deshacer

    this.selectedCell = null;
    this.isNotesMode = false;
    this.mistakes = 0;
    this.maxMistakes = 4;
    this.hintsRemaining = 3;
    this.isEliminated = false;
    this.isFinished = false;

    // Rondas multijugador
    this.totalMultiplayerRounds = 1;
    this.currentMultiplayerRound = 1;

    // Seguimiento de secciones completadas
    this.completedRows = new Set();
    this.completedCols = new Set();
    this.completedBoxes = new Set();

    // Bonificación de velocidad (< 1 min)
    this.speedBonusAwarded = new Set();

    // Cronómetro
    this.timerInterval = null;
    this.elapsedSeconds = 0;
    this.isGameActive = false;

    // Inicializar
    this.cacheDOM();
    this.bindEvents();
    this.setupMultiplayerCallbacks();
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
    this.domBtnSwitchMode = document.getElementById('btn-switch-mode');
    this.domModeIcon = document.getElementById('mode-icon');
    this.domModeText = document.getElementById('mode-text');
    this.domBtnLogout = document.getElementById('btn-logout');

    // HUD Multijugador en vivo
    this.domMpHud = document.getElementById('multiplayer-hud');
    this.domMpRoundIndicator = document.getElementById('mp-round-indicator');
    this.domMpRoomBadge = document.getElementById('mp-room-badge');
    this.domOpponentsContainer = document.getElementById('opponents-container');

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

    // Modal Autenticación (Login & Registro)
    this.domModalAuth = document.getElementById('modal-auth');
    this.domTabLogin = document.getElementById('tab-login');
    this.domTabRegister = document.getElementById('tab-register');
    this.domFormLogin = document.getElementById('form-login');
    this.domFormRegister = document.getElementById('form-register');
    this.domLoginUsername = document.getElementById('login-username');
    this.domLoginPin = document.getElementById('login-pin');
    this.domLoginErrorMsg = document.getElementById('login-error-msg');
    this.domRegisterUsername = document.getElementById('register-username');
    this.domRegisterPin = document.getElementById('register-pin');
    this.domRegisterErrorMsg = document.getElementById('register-error-msg');
    this.domAvatarOptions = document.querySelectorAll('.avatar-choice');
    this.domQuickAccountsSection = document.getElementById('quick-accounts-section');
    this.domSavedAccountsList = document.getElementById('saved-accounts-list');

    // Modal Selector de Modo
    this.domModalModeSelect = document.getElementById('modal-mode-select');
    this.domBtnSelectSolo = document.getElementById('btn-select-solo');
    this.domBtnSelectGroup = document.getElementById('btn-select-group');

    // Modal Lobby Multijugador
    this.domModalMpLobby = document.getElementById('modal-multiplayer-lobby');
    this.domMpViewMenu = document.getElementById('mp-view-menu');
    this.domMpViewCreate = document.getElementById('mp-view-create');
    this.domMpViewJoin = document.getElementById('mp-view-join');
    this.domMpViewRoom = document.getElementById('mp-view-room');

    this.domBtnMpOpenCreate = document.getElementById('btn-mp-open-create');
    this.domBtnMpOpenJoin = document.getElementById('btn-mp-open-join');
    this.domBtnMpCancelMenu = document.getElementById('btn-mp-cancel-menu');
    this.domBtnMpBackToMenu = document.getElementById('btn-mp-back-to-menu');
    this.domBtnMpSubmitCreate = document.getElementById('btn-mp-submit-create');
    this.domMpCreateDifficulty = document.getElementById('mp-create-difficulty');
    this.domMpCreateRounds = document.getElementById('mp-create-rounds');

    this.domBtnMpBackFromJoin = document.getElementById('btn-mp-back-from-join');
    this.domBtnMpSubmitJoin = document.getElementById('btn-mp-submit-join');
    this.domInputMpRoomCode = document.getElementById('input-mp-room-code');
    this.domJoinErrorMsg = document.getElementById('join-error-msg');

    this.domDisplayRoomCode = document.getElementById('display-room-code');
    this.domBtnCopyRoomCode = document.getElementById('btn-copy-room-code');
    this.domDisplayRoomRules = document.getElementById('display-room-rules');
    this.domMpPlayerCount = document.getElementById('mp-player-count');
    this.domLobbyPlayersGrid = document.getElementById('lobby-players-grid');
    this.domHostControlsPanel = document.getElementById('host-controls-panel');
    this.domBtnMpStartGame = document.getElementById('btn-mp-start-game');
    this.domGuestWaitingPanel = document.getElementById('guest-waiting-panel');
    this.domBtnMpLeaveRoom = document.getElementById('btn-mp-leave-room');

    // Modal Podio Multijugador
    this.domModalMpPodium = document.getElementById('modal-multiplayer-podium');
    this.domPodiumTitle = document.getElementById('podium-title');
    this.domPodiumSubtitle = document.getElementById('podium-subtitle');
    this.domPodiumRankingList = document.getElementById('podium-ranking-list');
    this.domBtnMpNextRound = document.getElementById('btn-mp-next-round');
    this.domBtnMpPodiumClose = document.getElementById('btn-mp-podium-close');

    // Otros modales (Game over solo, Victoria solo, Estadísticas)
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

    this.updateSoundIcon();

    // Comprobar autenticación previa
    if (!this.storage.hasActiveSession()) {
      this.showAuthModal();
    } else {
      this.loadUserProfile();
      this.startNewGame(1);
    }
  }

  loadUserProfile() {
    const profile = this.storage.getUserProfile();
    if (!profile) return;

    this.domUserAvatar.textContent = profile.avatar || '🦊';
    this.domUserName.textContent = profile.username || 'Jugador';
    this.domUserStars.textContent = profile.stars || 0;
  }

  // ==========================================================================
  // AUTENTICACIÓN (LOGIN & REGISTRO)
  // ==========================================================================
  showAuthModal() {
    this.domModalAuth.classList.remove('hidden');
    this.showLoginTab();
    this.renderQuickAccounts();
  }

  showLoginTab() {
    this.domTabLogin.classList.add('active');
    this.domTabRegister.classList.remove('active');
    this.domFormLogin.classList.remove('hidden');
    this.domFormRegister.classList.add('hidden');
    this.domLoginErrorMsg.classList.add('hidden');
    this.renderQuickAccounts();
  }

  showRegisterTab() {
    this.domTabRegister.classList.add('active');
    this.domTabLogin.classList.remove('active');
    this.domFormRegister.classList.remove('hidden');
    this.domFormLogin.classList.add('hidden');
    this.domRegisterErrorMsg.classList.add('hidden');
  }

  renderQuickAccounts() {
    const accounts = this.storage.getAllAccountsList();
    if (!accounts || accounts.length === 0) {
      this.domQuickAccountsSection.classList.add('hidden');
      return;
    }

    this.domQuickAccountsSection.classList.remove('hidden');
    this.domSavedAccountsList.innerHTML = '';

    accounts.forEach(acc => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'quick-account-pill';
      pill.innerHTML = `<span>${acc.avatar}</span> <strong>${acc.username}</strong>`;
      pill.addEventListener('click', () => {
        this.domLoginUsername.value = acc.username;
        this.domLoginPin.focus();
      });
      this.domSavedAccountsList.appendChild(pill);
    });
  }

  setupMultiplayerCallbacks() {
    this.multiplayer.setCallbacks({
      onLobbyUpdate: (roomState) => {
        this.renderLobbyState(roomState);
      },
      onGameStart: (data) => {
        this.domModalMpLobby.classList.add('hidden');
        this.gameMode = 'multiplayer';
        this.updateModeUI();

        this.difficulty = data.difficulty;
        this.domDifficulty.value = data.difficulty;
        this.domDifficulty.disabled = true; // Fijar en multijugador

        this.totalMultiplayerRounds = data.totalRounds || 1;
        this.currentMultiplayerRound = data.currentRound || 1;
        this.currentSeed = data.seed;

        this.startNewGame(this.difficulty, this.currentSeed);
        this.showToast('🚀 ¡Carrera Iniciada!', `Ronda ${this.currentMultiplayerRound} de ${this.totalMultiplayerRounds}. ¡El primero en terminar gana!`);
      },
      onProgressUpdate: (players) => {
        this.renderLiveOpponents(players);
      },
      onPlayerFinished: (player, rank, extra) => {
        if (player) {
          this.showToast('🏁 ¡Llegada a Meta!', `${player.avatar} ${player.name} terminó en el puesto #${rank}.`);
          this.audio.playBoxComplete();
        }
        if (extra && extra.canProceedToRound2) {
          // Ronda 1 concluida, mostrar podio intermedio
          this.showRoundPodium(extra.ranking, false);
        }
      },
      onPlayerEliminated: (player) => {
        if (player) {
          this.showToast('💀 Eliminado', `${player.avatar} ${player.name} cometió 4 fallas y fue eliminado.`);
        }
      },
      onNextRound: (data) => {
        this.domModalMpPodium.classList.add('hidden');
        this.currentMultiplayerRound = data.currentRound;
        this.currentSeed = data.seed;
        this.startNewGame(this.difficulty, this.currentSeed);
        this.showToast('⚡ ¡Ronda 2!', 'Comienza la Gran Final consecutiva.');
      },
      onFinalPodium: (podiumRanking) => {
        this.showRoundPodium(podiumRanking, true);
      }
    });
  }

  bindEvents() {
    // Pestañas de Autenticación
    this.domTabLogin.addEventListener('click', () => this.showLoginTab());
    this.domTabRegister.addEventListener('click', () => this.showRegisterTab());

    // Selección de Avatar en Registro
    let selectedAvatar = '🦊';
    this.domAvatarOptions.forEach(btn => {
      btn.addEventListener('click', () => {
        this.domAvatarOptions.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedAvatar = btn.dataset.avatar;
      });
    });

    // Envío de Formulario Login
    this.domFormLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = this.domLoginUsername.value.trim();
      const pin = this.domLoginPin.value.trim();

      const res = this.storage.login(user, pin);
      if (res.success) {
        this.domModalAuth.classList.add('hidden');
        this.loadUserProfile();
        this.showToast('¡Bienvenido de vuelta!', `Sesión iniciada como ${res.user.username}`);
        this.startNewGame(1);
      } else {
        this.domLoginErrorMsg.textContent = res.message;
        this.domLoginErrorMsg.classList.remove('hidden');
      }
    });

    // Envío de Formulario Registro
    this.domFormRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = this.domRegisterUsername.value.trim();
      const pin = this.domRegisterPin.value.trim();

      const res = this.storage.register(user, pin, selectedAvatar);
      if (res.success) {
        this.domModalAuth.classList.add('hidden');
        this.loadUserProfile();
        this.showToast('¡Cuenta Creada!', `Bienvenido ${res.user.username}, recibes 4 ⭐ de regalo.`);
        this.startNewGame(1);
      } else {
        this.domRegisterErrorMsg.textContent = res.message;
        this.domRegisterErrorMsg.classList.remove('hidden');
      }
    });

    // Cerrar sesión
    this.domBtnLogout.addEventListener('click', () => {
      if (confirm('¿Deseas cerrar tu sesión actual?')) {
        this.storage.logout();
        this.stopTimer();
        this.multiplayer.leaveRoom();
        this.showAuthModal();
      }
    });

    // Botón de alternar / elegir Modo
    this.domBtnSwitchMode.addEventListener('click', () => {
      this.domModalModeSelect.classList.remove('hidden');
    });

    this.domBtnSelectSolo.addEventListener('click', () => {
      this.domModalModeSelect.classList.add('hidden');
      this.switchToSoloMode();
    });

    this.domBtnSelectGroup.addEventListener('click', () => {
      this.domModalModeSelect.classList.add('hidden');
      this.openMultiplayerLobby();
    });

    // Lobby Multijugador: Navegación de vistas
    this.domBtnMpOpenCreate.addEventListener('click', () => {
      this.domMpViewMenu.classList.add('hidden');
      this.domMpViewCreate.classList.remove('hidden');
    });

    this.domBtnMpOpenJoin.addEventListener('click', () => {
      this.domMpViewMenu.classList.add('hidden');
      this.domMpViewJoin.classList.remove('hidden');
      this.domJoinErrorMsg.classList.add('hidden');
      this.domInputMpRoomCode.focus();
    });

    this.domBtnMpCancelMenu.addEventListener('click', () => {
      this.domModalMpLobby.classList.add('hidden');
    });

    this.domBtnMpBackToMenu.addEventListener('click', () => {
      this.domMpViewCreate.classList.add('hidden');
      this.domMpViewMenu.classList.remove('hidden');
    });

    this.domBtnMpBackFromJoin.addEventListener('click', () => {
      this.domMpViewJoin.classList.add('hidden');
      this.domMpViewMenu.classList.remove('hidden');
    });

    // Crear Sala Multijugador
    this.domBtnMpSubmitCreate.addEventListener('click', async () => {
      const user = this.storage.getUserProfile();
      if (!user) return;

      const diff = parseInt(this.domMpCreateDifficulty.value, 10);
      const rounds = parseInt(this.domMpCreateRounds.value, 10);

      this.domBtnMpSubmitCreate.disabled = true;
      this.domBtnMpSubmitCreate.textContent = 'Creando sala...';

      try {
        const { roomCode, roomState } = await this.multiplayer.createRoom(user, {
          difficulty: diff,
          rounds: rounds
        });

        this.domMpViewCreate.classList.add('hidden');
        this.domMpViewRoom.classList.remove('hidden');
        this.renderLobbyState(roomState);
      } catch (err) {
        alert('Error al conectar con la red de salas. Comprueba tu conexión a internet.');
      } finally {
        this.domBtnMpSubmitCreate.disabled = false;
        this.domBtnMpSubmitCreate.textContent = 'Generar Sala y Código';
      }
    });

    // Unirse a Sala con Código
    this.domBtnMpSubmitJoin.addEventListener('click', async () => {
      const code = this.domInputMpRoomCode.value.trim().toUpperCase();
      const user = this.storage.getUserProfile();
      if (!code || !user) {
        this.domJoinErrorMsg.textContent = 'Ingresa el código de sala.';
        this.domJoinErrorMsg.classList.remove('hidden');
        return;
      }

      this.domBtnMpSubmitJoin.disabled = true;
      this.domBtnMpSubmitJoin.textContent = 'Conectando...';

      try {
        await this.multiplayer.joinRoom(code, user);
        this.domMpViewJoin.classList.add('hidden');
        this.domMpViewRoom.classList.remove('hidden');
        this.domDisplayRoomCode.textContent = code;
      } catch (err) {
        this.domJoinErrorMsg.textContent = 'No se pudo conectar a la sala. Verifica el código.';
        this.domJoinErrorMsg.classList.remove('hidden');
      } finally {
        this.domBtnMpSubmitJoin.disabled = false;
        this.domBtnMpSubmitJoin.textContent = 'Conectarse a la Sala';
      }
    });

    // Copiar código de sala
    this.domBtnCopyRoomCode.addEventListener('click', () => {
      const code = this.domDisplayRoomCode.textContent;
      navigator.clipboard.writeText(code).then(() => {
        this.showToast('📋 Código Copiado', `El código ${code} está en tu portapapeles.`);
      });
    });

    // Iniciar partida desde el lobby (Host)
    this.domBtnMpStartGame.addEventListener('click', () => {
      this.multiplayer.startGame();
    });

    // Salir del lobby
    this.domBtnMpLeaveRoom.addEventListener('click', () => {
      this.multiplayer.leaveRoom();
      this.domMpViewRoom.classList.add('hidden');
      this.domMpViewMenu.classList.remove('hidden');
      this.domModalMpLobby.classList.add('hidden');
    });

    // Podio: Siguiente ronda (Host)
    this.domBtnMpNextRound.addEventListener('click', () => {
      this.multiplayer.startNextRound();
    });

    this.domBtnMpPodiumClose.addEventListener('click', () => {
      this.domModalMpPodium.classList.add('hidden');
      this.switchToSoloMode();
    });

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

    // Nuevo juego (Solo)
    this.domBtnNewGame.addEventListener('click', () => {
      if (this.gameMode === 'multiplayer') {
        if (confirm('Estás en una partida multijugador. ¿Deseas salir al Modo Solo?')) {
          this.switchToSoloMode();
        }
        return;
      }
      this.audio.playClick();
      this.startNewGame(parseInt(this.domDifficulty.value, 10));
    });

    // Cambio de dificultad
    this.domDifficulty.addEventListener('change', (e) => {
      if (this.gameMode === 'multiplayer') return;
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
      if (this.gameMode === 'multiplayer') {
        this.showToast('Ayuda no disponible', 'En carreras multijugador las pistas están desactivadas para juego limpio.');
        return;
      }
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

    // Revivir o reiniciar en Solo
    this.domBtnRevive.addEventListener('click', () => {
      this.reviveGame();
    });
    this.domBtnRestart.addEventListener('click', () => {
      this.domModalGameOver.classList.add('hidden');
      this.startNewGame(this.difficulty);
    });

    // Siguiente nivel tras ganar en Solo
    this.domBtnNextLevel.addEventListener('click', () => {
      this.domModalVictory.classList.add('hidden');
      const nextDiff = Math.min(5, this.difficulty + 1);
      this.domDifficulty.value = nextDiff;
      this.startNewGame(nextDiff);
    });
  }

  switchToSoloMode() {
    this.gameMode = 'solo';
    this.multiplayer.leaveRoom();
    this.updateModeUI();
    this.domDifficulty.disabled = false;
    this.startNewGame(parseInt(this.domDifficulty.value, 10));
    this.showToast('Modo Solitario', 'Entrenando en solitario.');
  }

  openMultiplayerLobby() {
    this.domMpViewMenu.classList.remove('hidden');
    this.domMpViewCreate.classList.add('hidden');
    this.domMpViewJoin.classList.add('hidden');
    this.domMpViewRoom.classList.add('hidden');
    this.domModalMpLobby.classList.remove('hidden');
  }

  updateModeUI() {
    if (this.gameMode === 'multiplayer') {
      this.domModeIcon.textContent = '👥';
      this.domModeText.textContent = 'En Grupo';
      this.domMpHud.classList.remove('hidden');
      this.domBtnHint.style.opacity = '0.5';
    } else {
      this.domModeIcon.textContent = '🎮';
      this.domModeText.textContent = 'Modo Solo';
      this.domMpHud.classList.add('hidden');
      this.domBtnHint.style.opacity = '1';
    }
  }

  renderLobbyState(roomState) {
    if (!roomState) return;

    this.domDisplayRoomCode.textContent = roomState.code || '---';

    const diffNames = { 1: 'Principiante', 2: 'Fácil', 3: 'Medio', 4: 'Difícil', 5: 'Experto' };
    this.domDisplayRoomRules.textContent = `Dificultad: ${diffNames[roomState.difficulty] || 'Fácil'} | Rondas: ${roomState.totalRounds || 1}`;

    const players = Object.values(roomState.players || {});
    this.domMpPlayerCount.textContent = players.length;
    this.domLobbyPlayersGrid.innerHTML = '';

    players.forEach(p => {
      const card = document.createElement('div');
      card.className = `lobby-player-item ${p.isHost ? 'is-host' : ''}`;
      card.innerHTML = `
        ${p.isHost ? '<span class="host-crown" title="Anfitrión">👑</span>' : ''}
        <span class="player-avatar-lobby">${p.avatar}</span>
        <span class="player-name-lobby">${p.name}</span>
      `;
      this.domLobbyPlayersGrid.appendChild(card);
    });

    if (this.multiplayer.isHost) {
      this.domHostControlsPanel.classList.remove('hidden');
      this.domGuestWaitingPanel.classList.add('hidden');
    } else {
      this.domHostControlsPanel.classList.add('hidden');
      this.domGuestWaitingPanel.classList.remove('hidden');
    }
  }

  renderLiveOpponents(players) {
    if (this.gameMode !== 'multiplayer' || !players) return;

    this.domOpponentsContainer.innerHTML = '';
    const myId = this.multiplayer.localPlayer?.id;

    this.domMpRoundIndicator.textContent = `Ronda ${this.currentMultiplayerRound} de ${this.totalMultiplayerRounds}`;
    this.domMpRoomBadge.textContent = `Sala: ${this.multiplayer.roomCode || '---'}`;

    players.forEach(p => {
      const isMe = p.id === myId;
      const card = document.createElement('div');
      card.className = `opponent-card ${isMe ? 'is-me' : ''}`;

      let statusHtml = `${p.progress || 0}%`;
      if (p.isEliminated) {
        statusHtml = '<span class="status-eliminated">💀 Eliminado</span>';
      } else if (p.isFinished) {
        statusHtml = `<span class="status-finished">🥇 #${p.rank || 1}</span>`;
      }

      card.innerHTML = `
        <span class="opponent-avatar">${p.avatar}</span>
        <span class="opponent-name">${p.name} ${isMe ? '(Tú)' : ''}</span>
        <div class="opponent-bar-wrapper">
          <div class="opponent-progress-bar" style="width: ${p.progress || 0}%"></div>
        </div>
        <span class="opponent-status-text">${statusHtml}</span>
      `;
      this.domOpponentsContainer.appendChild(card);
    });
  }

  showRoundPodium(ranking, isFinalRound) {
    this.domPodiumRankingList.innerHTML = '';
    this.domPodiumTitle.textContent = isFinalRound ? '🏆 ¡Gran Podio Final!' : `🏁 ¡Fin de la Ronda ${this.currentMultiplayerRound}!`;
    this.domPodiumSubtitle.textContent = isFinalRound
      ? '¡Los campeones definitivos de la carrera!'
      : 'Clasificación de esta ronda:';

    const medals = ['🥇', '🥈', '🥉', '4º', '5º', '6º'];

    (ranking || []).forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = `podium-row rank-${idx + 1}`;

      const medal = medals[idx] || `${idx + 1}º`;
      let timeText = p.isFinished ? `${p.finishTime || 0}s` : (p.isEliminated ? '💀 Eliminado' : `${p.progress}%`);

      row.innerHTML = `
        <div class="podium-player-info">
          <span class="podium-rank-badge">${medal}</span>
          <span class="player-avatar-lobby" style="font-size:1.5rem">${p.avatar}</span>
          <strong>${p.name}</strong>
        </div>
        <div class="podium-stats">
          <span>${timeText}</span>
        </div>
      `;
      this.domPodiumRankingList.appendChild(row);
    });

    if (isFinalRound) {
      this.domBtnMpNextRound.classList.add('hidden');
      this.domBtnMpPodiumClose.textContent = 'Volver al Menú';

      // Recompensar al ganador
      const winner = ranking[0];
      if (winner && winner.id === this.multiplayer.localPlayer?.id) {
        this.storage.recordMultiplayerMatch(true);
        this.loadUserProfile();
        this.showToast('🎉 ¡ERES EL CAMPEÓN!', 'Has ganado la carrera multijugador. +3 ⭐');
      } else {
        this.storage.recordMultiplayerMatch(false);
      }
    } else {
      if (this.multiplayer.isHost) {
        this.domBtnMpNextRound.classList.remove('hidden');
      } else {
        this.domBtnMpNextRound.classList.add('hidden');
      }
      this.domBtnMpPodiumClose.textContent = 'Salir del Grupo';
    }

    this.domModalMpPodium.classList.remove('hidden');
  }

  updateSoundIcon(isMuted = this.audio.isMuted) {
    this.domBtnSound.innerHTML = isMuted ? '<span>🔇</span>' : '<span>🔊</span>';
  }

  // ==========================================================================
  // FLUJO DE JUEGO (NUEVA PARTIDA)
  // ==========================================================================
  startNewGame(difficultyLevel = 1, seed = null) {
    this.difficulty = difficultyLevel;
    this.domDifficulty.value = difficultyLevel;

    // Reset de estado
    this.mistakes = 0;
    this.hintsRemaining = 3;
    this.isEliminated = false;
    this.isFinished = false;
    this.speedBonusAwarded.clear();
    this.completedRows.clear();
    this.completedCols.clear();
    this.completedBoxes.clear();
    this.notes = {};
    this.history = [];
    this.selectedCell = null;
    this.isNotesMode = false;
    this.domBtnNotes.classList.remove('active');

    // Generar puzzle (con semilla determinista para multijugador)
    const generated = this.generator.generate(this.difficulty, seed);
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

    if (this.gameMode === 'multiplayer') {
      this.multiplayer.sendProgress(0, 0);
    }
  }

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

  selectCell(r, c) {
    if (this.isEliminated) return;
    this.selectedCell = { r, c };
    const selectedVal = this.current[r][c];
    const selectedBox = Math.floor(r / 3) * 3 + Math.floor(c / 3);

    const cells = this.domBoard.querySelectorAll('.sudoku-cell');
    cells.forEach(cell => {
      const cr = parseInt(cell.dataset.row, 10);
      const cc = parseInt(cell.dataset.col, 10);
      const cbox = parseInt(cell.dataset.box, 10);
      const cval = this.current[cr][cc];

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

  // Entrada de un número
  inputNumber(num) {
    if (!this.isGameActive || !this.selectedCell || this.isEliminated) return;
    const { r, c } = this.selectedCell;

    if (this.puzzle[r][c] !== 0) return;

    if (this.isNotesMode) {
      this.toggleNote(r, c, num);
      return;
    }

    const key = `${r}-${c}`;
    const previousVal = this.current[r][c];
    const previousNotes = this.notes[key] ? new Set(this.notes[key]) : new Set();

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

      this.clearConflictingNotes(r, c, num);
      this.checkSectionCompletions(r, c);
      this.checkSpeedBonus(num);
      this.updateKeypadBadges();
      this.selectCell(r, c);

      // Transmitir progreso en multijugador
      this.broadcastProgressIfMultiplayer();

      // Comprobar victoria
      this.checkGameWon();
    } else {
      // Movimiento incorrecto
      this.mistakes++;
      this.audio.playError();
      this.triggerErrorVisual(r, c);
      this.updateMistakesDisplay();

      if (this.gameMode === 'multiplayer') {
        this.broadcastProgressIfMultiplayer();
      }

      if (this.mistakes >= this.maxMistakes) {
        if (this.gameMode === 'multiplayer') {
          // En multijugador, la 4ª falla elimina inmediatamente (sin revivir con estrellas)
          this.triggerMultiplayerElimination();
        } else {
          // En modo individual, abrir modal de Game Over con opción de revivir
          this.triggerGameOver();
        }
      }
    }
  }

  broadcastProgressIfMultiplayer() {
    if (this.gameMode !== 'multiplayer') return;

    let totalEmpty = 0;
    let filledByUser = 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.puzzle[r][c] === 0) {
          totalEmpty++;
          if (this.current[r][c] === this.solution[r][c]) {
            filledByUser++;
          }
        }
      }
    }

    const pct = totalEmpty > 0 ? Math.round((filledByUser / totalEmpty) * 100) : 0;
    this.multiplayer.sendProgress(pct, this.mistakes);
  }

  triggerMultiplayerElimination() {
    this.isEliminated = true;
    this.isGameActive = false;
    this.stopTimer();
    this.audio.playGameOver();
    this.multiplayer.sendEliminated();

    this.showToast('💀 ¡Eliminado de la Carrera!', 'Cometiste las 4 fallas. Has quedado fuera de esta ronda.');
  }

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

  eraseSelectedCell() {
    if (!this.isGameActive || !this.selectedCell || this.isEliminated) return;
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
    this.broadcastProgressIfMultiplayer();
  }

  useHint() {
    if (!this.isGameActive || this.isEliminated) return;
    if (this.hintsRemaining <= 0) {
      this.showToast('Sin ayudas', 'No te quedan pistas disponibles.');
      return;
    }

    let target = null;
    if (this.selectedCell && this.puzzle[this.selectedCell.r][this.selectedCell.c] === 0 && this.current[this.selectedCell.r][this.selectedCell.c] !== this.solution[this.selectedCell.r][this.selectedCell.c]) {
      target = this.selectedCell;
    } else {
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

  saveHistoryAction(action) {
    this.history.push(action);
    if (this.history.length > 30) this.history.shift();
  }

  undoMove() {
    if (!this.isGameActive || this.history.length === 0 || this.isEliminated) return;
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
    this.broadcastProgressIfMultiplayer();
  }

  clearConflictingNotes(row, col, num) {
    const boxR = Math.floor(row / 3) * 3;
    const boxC = Math.floor(col / 3) * 3;

    for (let i = 0; i < 9; i++) {
      const rowKey = `${row}-${i}`;
      if (this.notes[rowKey] && this.notes[rowKey].has(num)) {
        this.notes[rowKey].delete(num);
        this.renderNotesInCell(row, i);
      }
      const colKey = `${i}-${col}`;
      if (this.notes[colKey] && this.notes[colKey].has(num)) {
        this.notes[colKey].delete(num);
        this.renderNotesInCell(i, col);
      }
    }

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

  checkSectionCompletions(r, c) {
    // Fila
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

    // Columna
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

    // Bloque 3x3
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

  checkSpeedBonus(num) {
    if (this.speedBonusAwarded.has(num)) return;

    let count = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.current[r][c] === num && this.current[r][c] === this.solution[r][c]) {
          count++;
        }
      }
    }

    if (count === 9 && this.elapsedSeconds <= 60) {
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

  triggerRowGlow(r) {
    for (let c = 0; c < 9; c++) {
      const cell = this.getCellDOM(r, c);
      if (cell) {
        cell.classList.remove('glow-row');
        void cell.offsetWidth;
        cell.classList.add('glow-row');
        setTimeout(() => cell.classList.remove('glow-row'), 1200);
      }
    }
  }

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

  triggerBoardVictoryGlow() {
    const cells = this.domBoard.querySelectorAll('.sudoku-cell');
    cells.forEach((cell, idx) => {
      setTimeout(() => {
        cell.classList.add('glow-board-victory');
      }, (idx % 9) * 40 + Math.floor(idx / 9) * 30);
    });
  }

  triggerErrorVisual(r, c) {
    const cell = this.getCellDOM(r, c);
    if (!cell) return;
    cell.classList.add('error-shake');
    setTimeout(() => cell.classList.remove('error-shake'), 600);
  }

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

  reviveGame() {
    const success = this.storage.deductStars(2);
    if (success) {
      this.audio.playRevive();
      this.mistakes = 1;
      this.updateMistakesDisplay();
      this.loadUserProfile();
      this.domModalGameOver.classList.add('hidden');
      this.isGameActive = true;
      this.timerInterval = setInterval(() => {
        this.elapsedSeconds++;
        this.updateTimerDisplay();
      }, 1000);

      this.showToast('✨ ¡Revivido con Éxito!', 'Se descontaron 2 ⭐. Tus fallas ahora son 1/4.');
    }
  }

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
    this.isFinished = true;
    this.stopTimer();
    this.triggerBoardVictoryGlow();
    this.audio.playVictory();

    if (this.gameMode === 'multiplayer') {
      this.multiplayer.sendProgress(100, this.mistakes);
      this.multiplayer.sendFinished(this.elapsedSeconds);
      return true;
    }

    // Modo Solitario
    const baseStars = this.difficulty;
    const bonusZeroMistakes = this.mistakes === 0 ? 1 : 0;
    const totalEarned = baseStars + bonusZeroMistakes;

    this.storage.addStars(totalEarned);
    this.storage.recordVictory(this.difficulty, this.elapsedSeconds);
    this.loadUserProfile();

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

  handleKeyboard(e) {
    if (!this.isGameActive || this.isEliminated) return;

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
      if (this.gameMode !== 'multiplayer') {
        this.useHint();
      }
      return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      this.undoMove();
      return;
    }

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

    const diffNames = { 1: 'Principiante', 2: 'Fácil', 3: 'Medio', 4: 'Difícil', 5: 'Experto' };

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
        <h3>${profile.username}</h3>
        <p class="stars-badge-modal">⭐ ${profile.stars} Estrellas acumuladas</p>
      </div>
      <hr />
      <div class="stats-summary">
        <div class="stat-card">
          <span class="stat-val">${profile.gamesPlayed || 0}</span>
          <span class="stat-lbl">Partidas Solo</span>
        </div>
        <div class="stat-card">
          <span class="stat-val">${profile.gamesWon || 0}</span>
          <span class="stat-lbl">Victorias Solo</span>
        </div>
        <div class="stat-card">
          <span class="stat-val">${profile.multiplayerWins || 0}</span>
          <span class="stat-lbl">Victorias Grupo</span>
        </div>
      </div>
      <h4>Mejores Tiempos (Modo Solo):</h4>
      <div class="best-times-list">${bestTimesHtml}</div>
    `;

    this.domModalStats.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new SudokuApp();
});
