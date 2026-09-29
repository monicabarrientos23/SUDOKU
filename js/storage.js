/**
 * Sudoku Storage & Authentication Manager
 * Soporta registro y login multi-usuario con credenciales (PIN/contraseña),
 * sesiones activas, cambio de cuentas, economía de estrellas y estadísticas.
 */

class StorageManager {
  constructor() {
    this.ACCOUNTS_KEY = 'sudoku_accounts';
    this.SESSION_KEY = 'sudoku_active_session';
    this.THEME_KEY = 'sudoku_active_theme';

    this.migrateLegacyUser();
  }

  // Migra usuarios del sistema anterior de forma transparente
  migrateLegacyUser() {
    try {
      const legacyRaw = localStorage.getItem('sudoku_active_user');
      const accounts = this.getAllAccountsMap();

      if (legacyRaw && Object.keys(accounts).length === 0) {
        const legacy = JSON.parse(legacyRaw);
        if (legacy && legacy.name) {
          const key = legacy.name.trim().toLowerCase();
          accounts[key] = {
            username: legacy.name.trim(),
            pin: '1234',
            avatar: legacy.avatar || '🦊',
            stars: legacy.stars || 4,
            gamesPlayed: legacy.gamesPlayed || 0,
            gamesWon: legacy.gamesWon || 0,
            multiplayerPlayed: 0,
            multiplayerWins: 0,
            bestTimes: legacy.bestTimes || { 1: null, 2: null, 3: null, 4: null, 5: null },
            createdAt: legacy.createdAt || Date.now()
          };
          localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
          localStorage.setItem(this.SESSION_KEY, key);
        }
      }
    } catch (e) {
      console.warn('Error en migración de usuario legado', e);
    }
  }

  getAllAccountsMap() {
    try {
      const raw = localStorage.getItem(this.ACCOUNTS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  getAllAccountsList() {
    const map = this.getAllAccountsMap();
    return Object.values(map);
  }

  hasActiveSession() {
    const sessionKey = localStorage.getItem(this.SESSION_KEY);
    if (!sessionKey) return false;
    const accounts = this.getAllAccountsMap();
    return !!accounts[sessionKey];
  }

  getUserProfile() {
    const sessionKey = localStorage.getItem(this.SESSION_KEY);
    if (!sessionKey) return null;
    const accounts = this.getAllAccountsMap();
    return accounts[sessionKey] || null;
  }

  saveUserProfile(profile) {
    if (!profile || !profile.username) return;
    const key = profile.username.trim().toLowerCase();
    const accounts = this.getAllAccountsMap();
    accounts[key] = profile;
    localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  // Registrar nueva cuenta con Nombre, PIN y Avatar
  register(username, pin, avatar = '🦊') {
    const cleanName = (username || '').trim();
    const cleanPin = (pin || '').trim();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, message: 'El nombre debe tener al menos 2 caracteres.' };
    }
    if (!cleanPin || cleanPin.length < 3) {
      return { success: false, message: 'El PIN/clave debe tener al menos 3 dígitos o caracteres.' };
    }

    const key = cleanName.toLowerCase();
    const accounts = this.getAllAccountsMap();

    if (accounts[key]) {
      return { success: false, message: 'Ya existe una cuenta con este nombre. Inicia sesión en su lugar.' };
    }

    const newProfile = {
      username: cleanName,
      pin: cleanPin,
      avatar: avatar || '🦊',
      stars: 4, // 4 estrellas de bienvenida
      gamesPlayed: 0,
      gamesWon: 0,
      multiplayerPlayed: 0,
      multiplayerWins: 0,
      bestTimes: { 1: null, 2: null, 3: null, 4: null, 5: null },
      createdAt: Date.now()
    };

    accounts[key] = newProfile;
    localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
    localStorage.setItem(this.SESSION_KEY, key);

    return { success: true, user: newProfile };
  }

  // Iniciar sesión con Nombre y PIN
  login(username, pin) {
    const cleanName = (username || '').trim();
    const cleanPin = (pin || '').trim();

    if (!cleanName) {
      return { success: false, message: 'Ingresa tu nombre de usuario.' };
    }

    const key = cleanName.toLowerCase();
    const accounts = this.getAllAccountsMap();
    const user = accounts[key];

    if (!user) {
      return { success: false, message: 'Usuario no encontrado. Si no tienes cuenta, crea una en la pestaña Registro.' };
    }

    if (user.pin && user.pin !== cleanPin) {
      return { success: false, message: 'PIN o contraseña incorrecta.' };
    }

    localStorage.setItem(this.SESSION_KEY, key);
    return { success: true, user };
  }

  // Cerrar sesión
  logout() {
    localStorage.removeItem(this.SESSION_KEY);
  }

  // Operaciones de estrellas y estadísticas sobre la cuenta activa
  addStars(amount) {
    const profile = this.getUserProfile();
    if (!profile) return 0;
    profile.stars = (profile.stars || 0) + amount;
    this.saveUserProfile(profile);
    return profile.stars;
  }

  deductStars(amount) {
    const profile = this.getUserProfile();
    if (!profile) return false;
    if ((profile.stars || 0) >= amount) {
      profile.stars -= amount;
      this.saveUserProfile(profile);
      return true;
    }
    return false;
  }

  recordVictory(difficulty, timeSeconds) {
    const profile = this.getUserProfile();
    if (!profile) return;

    profile.gamesPlayed = (profile.gamesPlayed || 0) + 1;
    profile.gamesWon = (profile.gamesWon || 0) + 1;

    if (!profile.bestTimes) {
      profile.bestTimes = { 1: null, 2: null, 3: null, 4: null, 5: null };
    }

    const currentBest = profile.bestTimes[difficulty];
    if (currentBest === null || timeSeconds < currentBest) {
      profile.bestTimes[difficulty] = timeSeconds;
    }

    this.saveUserProfile(profile);
  }

  recordDefeat() {
    const profile = this.getUserProfile();
    if (!profile) return;
    profile.gamesPlayed = (profile.gamesPlayed || 0) + 1;
    this.saveUserProfile(profile);
  }

  recordMultiplayerMatch(isWinner) {
    const profile = this.getUserProfile();
    if (!profile) return;

    profile.multiplayerPlayed = (profile.multiplayerPlayed || 0) + 1;
    if (isWinner) {
      profile.multiplayerWins = (profile.multiplayerWins || 0) + 1;
      profile.stars = (profile.stars || 0) + 3; // +3 estrellas por victoria multijugador
    }
    this.saveUserProfile(profile);
  }

  getSavedTheme() {
    return localStorage.getItem(this.THEME_KEY) || 'theme-galaxy';
  }

  saveTheme(theme) {
    localStorage.setItem(this.THEME_KEY, theme);
  }
}

window.storageManager = new StorageManager();
