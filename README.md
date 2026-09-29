# 🧩 Sudoku Master - Modo Solo & Multijugador en Grupo

Un juego de Sudoku interactivo, moderno y completo desarrollado con tecnologías web estándar (HTML5, CSS3, JavaScript ES6), Web Audio API y WebSockets (MQTT/WSS). Listo para desplegar en **Vercel** y **GitHub Pages**.

---

## 🌟 Nuevas Características: Login & Multijugador en Grupo

### 1. Sistema de Autenticación (Login & Registro)
- **Pantalla de bienvenida con pestañas**:
  - **Iniciar Sesión**: Ingresa con tu nombre de usuario y PIN/clave. Si juegas en la misma computadora, aparecen botones de acceso rápido a las cuentas guardadas.
  - **Crear Cuenta**: Elige tu avatar (🦊, 🦁, 🐼, 🚀, 💎, 🐉, ⚡, 👑, 🦉, 🐱), escribe tu nombre de jugador y crea un PIN de acceso. ¡Recibes 4 ⭐ de bienvenida!
  - **Cerrar Sesión / Cambiar Cuenta**: Botón 🚪 en la barra superior para alternar entre diferentes perfiles manteniendo las estrellas y estadísticas de cada uno.

### 2. Modo Multijugador en Grupo (Salas por Código)
- **Crear Sala**:
  - El anfitrión hace clic en **"Crear Sala Nueva"**.
  - Configura el **Nivel de Dificultad** (Principiante, Fácil, Medio, Difícil, Experto).
  - Elige si competirán en **1 Partida Rápida** o **2 Partidas Consecutivas** (Gran Final).
  - Se genera un **Código de Sala** único de 6 caracteres (ej. `SDK-482`) con botón para copiar al portapapeles.
- **Unirse con Código**:
  - Los demás jugadores (2 o más desde cualquier PC en el mundo) entran a **"Jugar en Grupo"**, colocan el código de sala y se conectan instantáneamente.
- **Mismo Tablero para Todos (Generación por Semilla)**:
  - Todos los participantes reciben exactamente el mismo Sudoku y pistas iniciales para garantizar una competencia 100% justa.
- **Barra de Rivales en Vivo (HUD)**:
  - En la parte superior de la pantalla se muestra el avance en tiempo real de cada rival: avatar, porcentaje de completado (%) y estado.
- **Regla de Eliminación**:
  - Si un jugador comete **4 fallas**, queda automáticamente **Eliminado 💀** de la ronda (en multijugador no se puede revivir con estrellas para mantener la emoción de la carrera).
- **Podio y Rondas Consecutivas**:
  - El primero en terminar se corona con el **1º Lugar 🥇**, seguido del **2º 🥈**, **3º 🥉**, etc.
  - Si se seleccionaron **2 partidas consecutivas**, al terminar la primera se muestra la tabla intermedia y el anfitrión lanza la **Ronda 2**.
  - Al concluir la Gran Final, se proclama al campeón definitivo con podio animado y bonificación de estrellas.

---

## 🎮 Modo Solitario (Entrenamiento Individual)
- 5 niveles progresivos con tablero algorítmico instantáneo.
- Límite de 4 fallas con opción de **Revivir (-2 ⭐)** sin perder tu progreso.
- **Bonificación de Velocidad**: Colocar todos los números de un dígito en menos de 1 minuto otorga +1 Pista/Ayuda gratis.
- 5 fondos y temas visuales: *Galaxia Neón*, *Madera Zen*, *Bosque Esmeralda*, *Papel & Tinta*, *Cyberpunk*.
- Efectos de luz al completar filas, columnas y recuadros 3x3.
- Efectos sonoros generados en tiempo real con Web Audio API.

---

## 🚀 Cómo Desplegar y Probar

### En Vercel:
Dado que el proyecto utiliza WebSockets seguros (WSS) y es 100% estático (HTML/CSS/JS), puedes subirlo directamente a tu repositorio de GitHub y conectarlo a **Vercel**:
1. Haz push de estos archivos a tu repositorio: `https://github.com/monicabarrientos23/SUDOKU.git`
2. Vercel detectará automáticamente el archivo `index.html` y lo publicará en tu dominio `.vercel.app`.
3. ¡Cualquier persona con el enlace podrá registrarse, crear una sala y compartir el código para jugar juntos en tiempo real!

### En local:
Haz doble clic en `index.html` en dos ventanas de navegador diferentes (o una normal y una en incógnito) para probar el multijugador y ver cómo se sincronizan las salas en vivo.
