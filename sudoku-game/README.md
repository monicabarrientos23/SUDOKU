# 🧩 Sudoku Master - Videojuego Web

Un juego de Sudoku interactivo, moderno y completo desarrollado con tecnologías web estándar (HTML5, CSS3, JavaScript ES6) y Web Audio API.

---

## 🌟 Características Principales

1. **Registro de Jugador**:
   - Registro con selección de avatar personalizado y nombre antes de comenzar a jugar.
   - Guarda tu saldo de estrellas (⭐), partidas jugadas, victorias y mejores tiempos por dificultad en `localStorage`.

2. **Dificultad Progresiva (5 Niveles)**:
   - **Nivel 1: Principiante**: ~48 números dados (Gana 1 ⭐).
   - **Nivel 2: Fácil**: ~40 números dados (Gana 2 ⭐).
   - **Nivel 3: Medio**: ~34 números dados (Gana 3 ⭐).
   - **Nivel 4: Difícil**: ~28 números dados (Gana 4 ⭐).
   - **Nivel 5: Experto**: ~24 números dados (Gana 5 ⭐).
   - *Bonificación extra*: ¡Gana +1 estrella adicional si terminas la partida con 0 fallas!

3. **Límite de 4 Fallas y Sistema de Continuación**:
   - Contador visual de fallas con corazones interactivos (❤️/❌).
   - Al llegar a 4 fallas, aparece el menú de derrota.
   - **Revivir con Estrellas**: Si tienes 2 o más estrellas ganadas, puedes canjearlas para restaurar tus fallas a 1/4 y continuar jugando exactamente donde te quedaste sin perder tu progreso.

4. **Campos y Fondos Diferentes (Temas Visuales)**:
   - 🌌 **Galaxia Neón**: Fondo espacial profundo con celdas y bordes brillantes cian y magenta.
   - 🪵 **Madera Clásica**: Estilo tablero artesanal de madera cálida y estética zen.
   - 🌿 **Bosque Esmeralda**: Tonos verdes naturales y relajantes.
   - ☀️ **Papel & Tinta**: Estilo clásico de periódico minimalista de alta legibilidad.
   - 🌆 **Cyberpunk**: Estilo futurista de alto contraste con acentos en amarillo y fucsia eléctrico.

5. **Bonificación de Ayuda por Velocidad (< 1 minuto)**:
   - Si logras colocar todos los 9 ejemplares de cualquier dígito en el tablero en menos de 60 segundos desde el inicio, recibirás una alerta especial y ganarás **+1 Ayuda/Pista gratuita**.

6. **Efectos Luminosos Dinámicos (Glow Waves)**:
   - **Fila completada**: Ola de resplandor luminoso horizontal.
   - **Columna completada**: Haz de luz brillante vertical.
   - **Recuadro 3x3 completado**: Pulso perimetral y destello en todo el cuadrante.
   - **Sudoku resuelto**: Cascada dorada completa por todo el tablero.

7. **Efectos de Sonido Sintetizados (Web Audio API)**:
   - Efectos sonoros fluidos y musicales generados en tiempo real por el navegador (sin latencia ni descargas externas).
   - Tonos melódicos al colocar números, alertas suaves de error, arpegios al completar filas o recuadros, fanfarrias de victoria y botón de silenciador.

8. **Controles Táctiles y de Teclado**:
   - Soporte completo para móviles y escritorio.
   - Teclado numérico físico (1-9), flechas de dirección (o WASD), retroceso (Backspace), modo notas (`N`), pedir pista (`H`), y deshacer (`Ctrl+Z`).

---

## 🚀 Cómo Abrir y Jugar

Puedes abrir el juego de dos maneras muy sencillas:

### Opción 1: Abrir directamente el archivo en tu navegador
Haz doble clic en el archivo `index.html` o ábrelo en Google Chrome, Microsoft Edge, Mozilla Firefox o Safari.

### Opción 2: Usar un servidor local ligero
Si deseas probarlo mediante un servidor local, puedes ejecutar en la terminal:
```bash
python -m http.server 8000
```
Y abrir en tu navegador: `http://localhost:8000`
