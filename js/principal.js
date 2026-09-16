/* =============================================================================
   principal.js · La entrada
   -----------------------------------------------------------------------------
   Monta el escenario, registra los actos y arranca el único bucle que hay.
   Todo lo que este archivo hace es coser: la lógica vive en motor/ y actos/.
   ============================================================================= */

import { registrarGlobal, arrancar } from './motor/escenario.js?v=b6b3f3bf';
import { montarLienzo, mostrarLienzo, desvanecerMapa } from './motor/lienzo.js?v=b6b3f3bf';
import { desvanecerDibujo } from './motor/dibujo.js?v=b6b3f3bf';
import { nevar } from './motor/nieve.js?v=b6b3f3bf';
import { montarActoVuelo } from './actos/01-vuelo.js?v=b6b3f3bf';
import { montarActoLlegada } from './actos/02-llegada.js?v=b6b3f3bf';
import { montarActoAlCoche } from './actos/03-al-coche.js?v=b6b3f3bf';
import { tope } from './motor/util.js?v=b6b3f3bf';

/* --------------------------------------------------------------------------
   1 · El escenario y los actos
   -------------------------------------------------------------------------- */
montarLienzo();
montarActoVuelo();
montarActoLlegada();
montarActoAlCoche();

/* --------------------------------------------------------------------------
   2 · La barra de arriba y el raíl
   --------------------------------------------------------------------------
   Durante la portada estorban las dos cosas: aparecen cuando el título ya se ha
   ido. Como dependen del scroll absoluto y no de ningún acto, van aquí.
   -------------------------------------------------------------------------- */
const barra = document.getElementById('barra');
const rail = document.getElementById('rail');
/* 🚨 EL FIN DE LA PELICULA ES EL ULTIMO ACTO QUE EXISTA, y hay que moverlo
   cada vez que se anade uno. Con esto apuntando a 'llegada' y el acto 3 detras,
   el escenario se apagaba A MITAD DEL ACTO 3: los globales corren DESPUES de
   los actos, asi que ganan, y el mapa se iba justo mientras se trazaba la linea
   Keio hacia Shinjuku. */
const finPelicula = document.getElementById('al-coche');

registrarGlobal(function (scroll, alto, sinMovimiento) {
  const pasadaLaPortada = sinMovimiento || scroll > alto * 0.9;
  if (barra) {
    barra.classList.toggle('visible', pasadaLaPortada);
    barra.classList.toggle('posada', scroll > 8);
  }
  if (rail) rail.classList.toggle('visible', pasadaLaPortada);

  /* 🚨 CÓMO SE ACABA LA PELÍCULA.
     A partir de aquí la página son capítulos de texto, y una capa fija por
     encima solo molesta. Pero apagarla de golpe se ve: Kiko lo dijo viendo el
     acto 3, «de repente desaparece y tarda un rato en llegar lo otro».

     Así que el dibujo se va cayendo al fondo durante la pantalla siguiente al
     final del último acto, y con él la nevada. El mapa, que a esas alturas ya
     está apagado, se retira cuando la sección sale de pantalla.

     La cuenta: mientras el acto corre, su sección llega por debajo del borde
     inferior, así que `alto - bottom` es negativo y esto vale 0. Justo en el
     último fotograma del acto, bottom vale `alto` y sigue valiendo 0. De ahí en
     adelante bottom baja hasta 0 y esto sube hasta 1: exactamente una pantalla
     de desvanecido. */
  if (finPelicula) {
    const caja = finPelicula.getBoundingClientRect();
    /* 🚨 EL MAPA Y EL DIBUJO NO SE VAN A LA VEZ, y el orden importa.

       Kiko, el 17 de septiembre, corrigiéndose a sí mismo: «el coche no tiene
       que desaparecer, ni la nieve, ni la carretera, hasta que ya haya entrado
       bastante la otra sección… pero en el momento en que empieza a entrar la
       sección nueva, quitar el mapa, para que solamente se quede el coche con
       la nieve y el paisaje».

       O sea: el mapa de Japón ha contado lo suyo y estorba en cuanto llega el
       alojamiento, así que se va enseguida. El coche, la nieve y el bosque son
       el sitio donde estamos, y se quedan hasta que el capítulo ya está puesto.

       🚨 Cuando exista el acto 4 esto cambia de sitio, no de idea: el mapa se
       irá igual y el paisaje seguirá, pero el relevo lo hará el acto. */
    const fin = tope((alto - caja.bottom) / alto);
    desvanecerMapa(tope(fin / 0.25));
    desvanecerDibujo(tope((fin - 0.45) / 0.55));
    /* La nieve se va con él. Y además se va PORQUE se va: sesenta copos
       animados dentro de una capa a la que se le está bajando la opacidad
       obligan al navegador a componer el grupo aparte en cada fotograma
       (ley 15). Menos copos, menos factura. */
    if (fin > 0) nevar(1 - tope((fin - 0.45) / 0.55));
    if (caja.bottom < 0) mostrarLienzo(false);
  }
});

/* --------------------------------------------------------------------------
   3 · Los capítulos que todavía no son película
   --------------------------------------------------------------------------
   Nieve, Kioto, Año Nuevo y la vuelta siguen siendo secciones de texto hasta
   que les toque su acto. Conservan la aparición al entrar y la ambientación
   que ya tenían: no se tira lo que funciona (NORMAS § 11.7).
   -------------------------------------------------------------------------- */
const capitulos = Array.from(document.querySelectorAll('.cap'));
const enlacesRail = Array.from(document.querySelectorAll('.rail a'));

/* La pagoda se dibuja sola: el CSS necesita saber cuánto mide cada trazo */
for (const trazo of document.querySelectorAll('.ambiente-kioto .pagoda path')) {
  try {
    trazo.style.setProperty('--len', trazo.getTotalLength().toFixed(1));
  } catch (e) { /* un navegador sin getTotalLength: sale entera y ya */ }
}

registrarGlobal(function (scroll, alto) {
  for (const cap of capitulos) {
    const caja = cap.getBoundingClientRect();
    if (caja.bottom < -alto || caja.top > alto * 1.4) continue;
    cap.style.setProperty('--p-cap', tope((alto - caja.top) / (alto * 0.75)).toFixed(3));
  }
});

if ('IntersectionObserver' in window) {
  const vigia = new IntersectionObserver((entradas) => {
    for (const e of entradas) if (e.isIntersecting) e.target.classList.add('dentro');
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  for (const cap of capitulos) vigia.observe(cap);

  /* El raíl marca dónde vas. Los actos también participan: son secciones. */
  const marcables = Array.from(document.querySelectorAll('.acto, .cap'));
  const vigiaRail = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      for (const a of enlacesRail) {
        a.setAttribute('aria-current', a.dataset.rail === e.target.id ? 'true' : 'false');
      }
    }
  }, { rootMargin: '-45% 0px -45% 0px' });
  for (const m of marcables) vigiaRail.observe(m);
} else {
  for (const cap of capitulos) cap.classList.add('dentro');
}

/* --------------------------------------------------------------------------
   4 · En marcha
   -------------------------------------------------------------------------- */
arrancar();
