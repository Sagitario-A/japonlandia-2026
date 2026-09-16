/* =============================================================================
   principal.js · La entrada
   -----------------------------------------------------------------------------
   Monta el escenario, registra los actos y arranca el único bucle que hay.
   Todo lo que este archivo hace es coser: la lógica vive en motor/ y actos/.
   ============================================================================= */

import { registrarGlobal, arrancar } from './motor/escenario.js';
import { montarLienzo, mostrarLienzo } from './motor/lienzo.js';
import { montarActoVuelo } from './actos/01-vuelo.js';
import { montarActoLlegada } from './actos/02-llegada.js';
import { tope } from './motor/util.js';

/* --------------------------------------------------------------------------
   1 · El escenario y los actos
   -------------------------------------------------------------------------- */
montarLienzo();
montarActoVuelo();
montarActoLlegada();

/* --------------------------------------------------------------------------
   2 · La barra de arriba y el raíl
   --------------------------------------------------------------------------
   Durante la portada estorban las dos cosas: aparecen cuando el título ya se ha
   ido. Como dependen del scroll absoluto y no de ningún acto, van aquí.
   -------------------------------------------------------------------------- */
const barra = document.getElementById('barra');
const rail = document.getElementById('rail');
const finPelicula = document.getElementById('llegada');

registrarGlobal(function (scroll, alto, sinMovimiento) {
  const pasadaLaPortada = sinMovimiento || scroll > alto * 0.9;
  if (barra) {
    barra.classList.toggle('visible', pasadaLaPortada);
    barra.classList.toggle('posada', scroll > 8);
  }
  if (rail) rail.classList.toggle('visible', pasadaLaPortada);

  /* El escenario se apaga cuando la película ha terminado: a partir de ahí la
     página son capítulos de texto y una capa fija por encima solo molesta. */
  if (finPelicula) {
    const caja = finPelicula.getBoundingClientRect();
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
