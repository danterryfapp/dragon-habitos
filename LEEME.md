# Dragon Hábitos — Instalación en tu iPhone

Esta carpeta es una app web completa (PWA). Para instalarla en tu iPhone como
una app real, primero hay que subirla a internet (Apple no permite instalar
apps desde archivos locales) y después instalarla desde Safari. Es gratis y
te lleva unos 5 minutos.

## Paso 1: Subir los archivos (elige una opción)

### Opción A — Netlify Drop (la más fácil, sin crear cuenta)
1. Desde tu compu, entrá a **https://app.netlify.com/drop**
2. Arrastrá esta carpeta completa (`dragon-habitos-pwa`) a la página
3. Te da un link tipo `https://algo-random.netlify.app` — ese es tu link

### Opción B — GitHub Pages (gratis, queda permanente con tu cuenta)
1. Creá un repositorio nuevo en GitHub (puede ser privado)
2. Subí todos los archivos de esta carpeta a la raíz del repositorio
3. En **Settings → Pages**, elegí la rama `main` como fuente
4. Te da un link tipo `https://tu-usuario.github.io/tu-repo`

Cualquiera de las dos opciones funciona igual. Netlify es más rápido para
empezar; GitHub Pages es mejor si después querés seguir editando el código.

## Paso 2: Instalar en tu iPhone

1. Abrí **Safari** en el iPhone (tiene que ser Safari, no Chrome)
2. Entrá al link que te dieron en el paso 1
3. Tocá el botón de **compartir** (el cuadrito con la flecha hacia arriba)
4. Deslizá y tocá **"Agregar a pantalla de inicio"**
5. Confirmá el nombre y tocá **"Agregar"**

Listo. Te queda un ícono propio en la pantalla de inicio. Al abrirlo, corre
en pantalla completa, sin la barra de Safari, y funciona sin internet
gracias al service worker incluido.

## Notas importantes

- **Los datos se guardan en el propio iPhone** (localStorage), no en ningún
  servidor. Si borrás la app o los datos de Safari para ese sitio, se
  pierde el historial. No hay forma de sincronizar entre dispositivos con
  esta versión.
- Si en algún momento querés cambiar algo del diseño o agregar funciones,
  el archivo a editar es `app.js` (toda la lógica y el diseño están ahí).
- `index.html` no necesita tocarse salvo que cambies nombres de archivos.
