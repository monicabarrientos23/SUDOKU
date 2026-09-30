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

    // Limpieza solicitada por el usuario: eliminar todos los usuarios previos con contraseñas olvidadas
    this.checkAndWipeAccounts();
  }

  // Comprueba si se debe hacer la limpieza inicial de cuentas
  checkAndWipeAccounts() {
    const WIPE_KEY = 'sudoku_accounts_wiped_v4';
    if (!localStorage.getItem(WIPE_KEY)) {
      this.resetAllAccounts();
      localStorage.setItem(WIPE_KEY, 'true');
    }
  }

  // Elimina absolutamente todas las cuentas, sesiones y datos de usuario guardados
  resetAllAccounts() {
    localStorage.removeItem(this.ACCOUNTS_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem('sudoku_active_user');
    return true;
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

  // Registrar nueva cuenta con Nombre, Contraseña, Confirmación de Contraseña y Avatar
  register(username, pin, confirmPin, avatar = '🦊') {
    const cleanName = (username || '').trim();
    const cleanPin = (pin || '').trim();
    const cleanConfirm = (confirmPin || '').trim();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, message: 'El nombre debe tener al menos 2 caracteres.' };
    }
    if (!cleanPin || cleanPin.length < 3) {
      return { success: false, message: 'La contraseña debe tener al menos 3 caracteres.' };
    }
    if (cleanPin !== cleanConfirm) {
      return { success: false, message: 'Las contraseñas no coinciden. Por favor confirma que sean exactamente iguales.' };
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

  // Iniciar sesión con Nombre y Contraseña
  login(username, pin) {
    const cleanName = (username || '').trim();
    const cleanPin = (pin || '').trim();

    if (!cleanName) {
      return { success: false, message: 'Ingresa tu nombre de usuario.' };
    }
    if (!cleanPin) {
      return { success: false, message: 'Ingresa tu contraseña.' };
    }

    const key = cleanName.toLowerCase();
    const accounts = this.getAllAccountsMap();
    const user = accounts[key];

    if (!user) {
      return { success: false, message: 'Usuario no encontrado. Si eres nuevo, haz clic en Crear Cuenta.' };
    }

    if (user.pin && user.pin !== cleanPin) {
      return { success: false, message: 'Contraseña incorrecta. Si la olvidaste, puedes restablecer las cuentas abajo.' };
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
