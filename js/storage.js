/**
 * Sudoku Storage & Profile Manager
 * Gestiona el perfil del jugador, registro, economía de estrellas y estadísticas.
 */

class StorageManager {
  constructor() {
    this.USER_KEY = 'sudoku_active_user';
    this.THEME_KEY = 'sudoku_active_theme';
  }

  hasRegisteredUser() {
    const data = localStorage.getItem(this.USER_KEY);
    return !!data;
  }

  getUserProfile() {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error al leer perfil de usuario', e);
      return null;
    }
  }

  registerUser(name, avatar = '🦊') {
    const profile = {
      name: name.trim() || 'Jugador',
      avatar: avatar || '🦊',
      stars: 4, // 4 estrellas iniciales de bienvenida para que puedan revivir si lo necesitan
      gamesPlayed: 0,
      gamesWon: 0,
      bestTimes: { 1: null, 2: null, 3: null, 4: null, 5: null },
      createdAt: Date.now()
    };
    this.saveUserProfile(profile);
    return profile;
  }

  saveUserProfile(profile) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(profile));
  }

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

  getSavedTheme() {
    return localStorage.getItem(this.THEME_KEY) || 'theme-galaxy';
  }

  saveTheme(theme) {
    localStorage.setItem(this.THEME_KEY, theme);
  }
}

window.storageManager = new StorageManager();
