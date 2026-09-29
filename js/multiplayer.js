/**
 * Sudoku Multiplayer Manager
 * Conexión en tiempo real vía WebSockets (MQTT/WSS) para salas multijugador en Vercel.
 * Sincroniza salas, jugadores, tablero idéntico por semilla, barras de progreso y podio.
 */

class MultiplayerManager {
  constructor() {
    this.client = null;
    this.roomCode = null;
    this.isHost = false;
    this.localPlayer = null;
    this.roomState = null;
    this.heartbeatTimer = null;

    // Callbacks suscritos desde app.js
    this.callbacks = {
      onLobbyUpdate: () => {},
      onGameStart: () => {},
      onProgressUpdate: () => {},
      onPlayerEliminated: () => {},
      onPlayerFinished: () => {},
      onNextRound: () => {},
      onFinalPodium: () => {},
      onConnectionStatus: () => {}
    };

    // Servidores WebSocket seguros públicos
    this.brokers = [
      'wss://broker.emqx.io:8084/mqtt',
      'wss://broker.hivemq.com:8884/mqtt'
    ];
  }

  setCallbacks(cbs) {
    this.callbacks = { ...this.callbacks, ...cbs };
  }

  // Genera un código de sala legible de 6 caracteres (ej. SDK-482)
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'SDK-';
    for (let i = 0; i < 3; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Conectar al broker MQTT
  connect(brokerIndex = 0) {
    return new Promise((resolve, reject) => {
      if (this.client && this.client.connected) {
        return resolve(this.client);
      }

      if (!window.mqtt) {
        console.warn('Librería MQTT no disponible globalmente.');
        return reject(new Error('Librería MQTT no cargada'));
      }

      const brokerUrl = this.brokers[brokerIndex % this.brokers.length];
      const clientId = 'sudoku_' + Math.random().toString(16).substr(2, 8);

      try {
        this.client = window.mqtt.connect(brokerUrl, {
          clientId,
          clean: true,
          connectTimeout: 7000,
          reconnectPeriod: 3000
        });

        this.client.on('connect', () => {
          this.callbacks.onConnectionStatus({ connected: true, broker: brokerUrl });
          resolve(this.client);
        });

        this.client.on('error', (err) => {
          console.warn('Error MQTT en broker:', brokerUrl, err);
          if (brokerIndex < this.brokers.length - 1) {
            this.connect(brokerIndex + 1).then(resolve).catch(reject);
          } else {
            reject(err);
          }
        });

        this.client.on('message', (topic, message) => {
          this.handleIncomingMessage(topic, message.toString());
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  getTopic(code = this.roomCode) {
    return `sudoku/v2/rooms/${code.replace('-', '').toUpperCase()}`;
  }

  // Crear una nueva sala como Anfitrión
  async createRoom(hostUser, options = {}) {
    await this.connect();
    this.isHost = true;
    this.roomCode = this.generateRoomCode();

    const playerId = 'p_' + Math.random().toString(36).substr(2, 7);
    this.localPlayer = {
      id: playerId,
      name: hostUser.username,
      avatar: hostUser.avatar,
      isHost: true,
      progress: 0,
      mistakes: 0,
      isEliminated: false,
      isFinished: false,
      finishTime: null,
      roundsWon: 0,
      roundScores: []
    };

    this.roomState = {
      code: this.roomCode,
      difficulty: options.difficulty || 2, // 1: Principiante, 2: Fácil, 3: Medio, 4: Difícil, 5: Experto
      totalRounds: options.rounds || 1,    // 1 o 2 juegos consecutivos
      currentRound: 1,
      status: 'lobby', // 'lobby' | 'playing' | 'round_summary' | 'game_over'
      seed: Math.floor(Math.random() * 10000000),
      players: {
        [playerId]: this.localPlayer
      },
      roundResults: []
    };

    const topic = this.getTopic();
    this.client.subscribe(topic, { qos: 1 });

    // Emisión periódica del estado del lobby por el Host
    this.startHeartbeat();
    this.broadcastState();

    return { roomCode: this.roomCode, roomState: this.roomState };
  }

  // Unirse a una sala existente con el código
  async joinRoom(roomCode, user) {
    await this.connect();
    this.isHost = false;
    this.roomCode = roomCode.trim().toUpperCase();

    const playerId = 'p_' + Math.random().toString(36).substr(2, 7);
    this.localPlayer = {
      id: playerId,
      name: user.username,
      avatar: user.avatar,
      isHost: false,
      progress: 0,
      mistakes: 0,
      isEliminated: false,
      isFinished: false,
      finishTime: null,
      roundsWon: 0,
      roundScores: []
    };

    const topic = this.getTopic();
    this.client.subscribe(topic, { qos: 1 });

    // Enviar solicitud de ingreso
    this.sendMessage({
      type: 'JOIN_REQUEST',
      player: this.localPlayer
    });

    return { roomCode: this.roomCode, localPlayer: this.localPlayer };
  }

  // Enviar mensaje al tópico de la sala
  sendMessage(payload) {
    if (!this.client || !this.roomCode) return;
    const topic = this.getTopic();
    const data = JSON.stringify({
      ...payload,
      senderId: this.localPlayer?.id,
      timestamp: Date.now()
    });
    this.client.publish(topic, data, { qos: 1 });
  }

  // Heartbeat del Host para mantener el lobby sincronizado
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isHost && this.roomState && this.roomState.status === 'lobby') {
        this.broadcastState();
      }
    }, 2500);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  broadcastState() {
    if (!this.isHost || !this.roomState) return;
    this.sendMessage({
      type: 'ROOM_STATE_UPDATE',
      state: this.roomState
    });
  }

  // Iniciar la partida (Solo el Host)
  startGame() {
    if (!this.isHost || !this.roomState) return;

    this.roomState.status = 'playing';
    this.roomState.currentRound = 1;
    this.roomState.seed = Math.floor(Math.random() * 10000000);

    // Resetear estados de juego de cada jugador
    Object.values(this.roomState.players).forEach(p => {
      p.progress = 0;
      p.mistakes = 0;
      p.isEliminated = false;
      p.isFinished = false;
      p.finishTime = null;
    });

    this.sendMessage({
      type: 'GAME_START',
      seed: this.roomState.seed,
      difficulty: this.roomState.difficulty,
      totalRounds: this.roomState.totalRounds,
      currentRound: 1,
      players: this.roomState.players
    });

    this.stopHeartbeat();
  }

  // Iniciar la siguiente ronda consecutiva (Ronda 2 de 2)
  startNextRound() {
    if (!this.isHost || !this.roomState) return;

    this.roomState.currentRound = 2;
    this.roomState.status = 'playing';
    this.roomState.seed = Math.floor(Math.random() * 10000000);

    Object.values(this.roomState.players).forEach(p => {
      p.progress = 0;
      p.mistakes = 0;
      p.isEliminated = false;
      p.isFinished = false;
      p.finishTime = null;
    });

    this.sendMessage({
      type: 'START_NEXT_ROUND',
      seed: this.roomState.seed,
      currentRound: 2,
      difficulty: this.roomState.difficulty
    });
  }

  // Enviar progreso en vivo del jugador local
  sendProgress(progressPercent, mistakesCount) {
    if (!this.localPlayer) return;

    this.localPlayer.progress = progressPercent;
    this.localPlayer.mistakes = mistakesCount;

    this.sendMessage({
      type: 'PROGRESS_UPDATE',
      playerId: this.localPlayer.id,
      progress: progressPercent,
      mistakes: mistakesCount
    });
  }

  // Enviar evento de llegada a la meta (completó el Sudoku)
  sendFinished(finishTimeSeconds) {
    if (!this.localPlayer) return;

    this.localPlayer.isFinished = true;
    this.localPlayer.finishTime = finishTimeSeconds;

    this.sendMessage({
      type: 'PLAYER_FINISHED',
      playerId: this.localPlayer.id,
      finishTime: finishTimeSeconds
    });
  }

  // Enviar evento de eliminación (4 fallas)
  sendEliminated() {
    if (!this.localPlayer) return;

    this.localPlayer.isEliminated = true;

    this.sendMessage({
      type: 'PLAYER_ELIMINATED',
      playerId: this.localPlayer.id
    });
  }

  // Procesar mensajes entrantes de la red
  handleIncomingMessage(topic, messageStr) {
    try {
      const data = JSON.parse(messageStr);
      const { type } = data;

      // 1. Solicitud de ingreso de nuevo jugador (el Host la procesa y acepta)
      if (type === 'JOIN_REQUEST') {
        if (this.isHost && this.roomState) {
          const newPlayer = data.player;
          this.roomState.players[newPlayer.id] = newPlayer;
          this.broadcastState();
          this.callbacks.onLobbyUpdate(this.roomState);
        }
      }

      // 2. Actualización de estado del Lobby
      else if (type === 'ROOM_STATE_UPDATE') {
        this.roomState = data.state;
        if (this.localPlayer && this.roomState.players[this.localPlayer.id]) {
          this.localPlayer = this.roomState.players[this.localPlayer.id];
        }
        this.callbacks.onLobbyUpdate(this.roomState);
      }

      // 3. Inicio de la partida
      else if (type === 'GAME_START') {
        if (!this.roomState) {
          this.roomState = { players: data.players };
        }
        this.roomState.status = 'playing';
        this.roomState.seed = data.seed;
        this.roomState.difficulty = data.difficulty;
        this.roomState.totalRounds = data.totalRounds;
        this.roomState.currentRound = data.currentRound;

        this.callbacks.onGameStart(data);
      }

      // 4. Actualización de progreso en tiempo real de cualquier jugador
      else if (type === 'PROGRESS_UPDATE') {
        if (this.roomState && this.roomState.players[data.playerId]) {
          const player = this.roomState.players[data.playerId];
          player.progress = data.progress;
          player.mistakes = data.mistakes;
          this.callbacks.onProgressUpdate(Object.values(this.roomState.players));
        }
      }

      // 5. Jugador terminó el tablero
      else if (type === 'PLAYER_FINISHED') {
        if (this.roomState && this.roomState.players[data.playerId]) {
          const player = this.roomState.players[data.playerId];
          player.isFinished = true;
          player.finishTime = data.finishTime;

          // Asignar posición de llegada
          const finishedCount = Object.values(this.roomState.players).filter(p => p.isFinished).length;
          player.rank = finishedCount;

          this.callbacks.onPlayerFinished(player, finishedCount);
          this.callbacks.onProgressUpdate(Object.values(this.roomState.players));

          // Si todos terminaron o fueron eliminados, mostrar podio de ronda
          this.checkRoundCompletion();
        }
      }

      // 6. Jugador eliminado (4 fallas)
      else if (type === 'PLAYER_ELIMINATED') {
        if (this.roomState && this.roomState.players[data.playerId]) {
          const player = this.roomState.players[data.playerId];
          player.isEliminated = true;

          this.callbacks.onPlayerEliminated(player);
          this.callbacks.onProgressUpdate(Object.values(this.roomState.players));

          this.checkRoundCompletion();
        }
      }

      // 7. Siguiente ronda consecutiva
      else if (type === 'START_NEXT_ROUND') {
        if (this.roomState) {
          this.roomState.currentRound = data.currentRound;
          this.roomState.seed = data.seed;
          this.roomState.status = 'playing';

          Object.values(this.roomState.players).forEach(p => {
            p.progress = 0;
            p.mistakes = 0;
            p.isEliminated = false;
            p.isFinished = false;
            p.finishTime = null;
          });
        }
        this.callbacks.onNextRound(data);
      }

      // 8. Podio Final definitivo
      else if (type === 'FINAL_PODIUM') {
        this.callbacks.onFinalPodium(data.podium);
      }

    } catch (e) {
      console.warn('Error al procesar mensaje multijugador:', e);
    }
  }

  // Verifica si todos los jugadores terminaron o fueron eliminados
  checkRoundCompletion() {
    if (!this.roomState) return;
    const players = Object.values(this.roomState.players);
    const active = players.filter(p => !p.isFinished && !p.isEliminated);

    if (active.length === 0) {
      // Todos terminaron o fueron eliminados
      const rankedPlayers = [...players].sort((a, b) => {
        if (a.isFinished && !b.isFinished) return -1;
        if (!a.isFinished && b.isFinished) return 1;
        if (a.isFinished && b.isFinished) return (a.finishTime || 9999) - (b.finishTime || 9999);
        return 0;
      });

      // Guardar resultados de la ronda
      if (!this.roomState.roundResults) this.roomState.roundResults = [];
      this.roomState.roundResults.push({
        round: this.roomState.currentRound,
        ranking: rankedPlayers
      });

      const isFinalRound = this.roomState.currentRound >= this.roomState.totalRounds;

      if (isFinalRound) {
        if (this.isHost) {
          this.sendMessage({
            type: 'FINAL_PODIUM',
            podium: rankedPlayers
          });
        }
        this.callbacks.onFinalPodium(rankedPlayers);
      } else {
        // Pausa y opción para continuar a Ronda 2
        this.callbacks.onPlayerFinished(null, null, { canProceedToRound2: true, ranking: rankedPlayers });
      }
    }
  }

  // Salir de la sala
  leaveRoom() {
    this.stopHeartbeat();
    if (this.client && this.roomCode) {
      try {
        const topic = this.getTopic();
        this.client.unsubscribe(topic);
      } catch (e) {}
    }
    this.roomCode = null;
    this.isHost = false;
    this.roomState = null;
    this.localPlayer = null;
  }
}

window.multiplayerManager = new MultiplayerManager();
