/* =============================================================================
   motor/escenario.js · Quién pinta y cuándo
   -----------------------------------------------------------------------------
   Ocho actos, UN SOLO listener de scroll y UN SOLO requestAnimationFrame
   (NORMAS § 9). Cada acto se registra con su elemento y su función `pintar(p)`,
   donde `p` va de 0 a 1 según lo que lleves recorrido de ESE acto.

   🚨 Solo se pinta el acto que está en pantalla, más el de al lado. Los seis
   restantes no cuestan nada: es lo que permite que la película sea larga sin
   ser lenta.
   ============================================================================= */

import { tope } from './util.js?v=c94af970';

const actos = [];
const globales = [];

let sinMovimiento = false;
let pendiente = false;
let arrancado = false;

/* --------------------------------------------------------------------------
   Registro
   -------------------------------------------------------------------------- */

/**
 * @param {object} def
 * @param {string} def.id            para depurar y para el raíl
 * @param {Element} def.el           la <section> del acto
 * @param {Function} def.pintar      pintar(p, ctx)
 * @param {Function} [def.preparar]  se llama una vez, antes del primer pintado
 */
export function registrarActo(def) {
  if (!def.el) return null;                 /* el acto aún no existe en el HTML */

  const escena = def.el.querySelector('.escena') || def.el;
  const acto = {
    id: def.id,
    el: def.el,
    escena,
    pintar: def.pintar,
    preparar: def.preparar,
    listo: false,
    activo: false,
    ultimo: -1,
    /* Escribir una variable CSS en la escena. Es la única manera en que el
       JavaScript mueve el dibujo: ni toca estilos sueltos ni escribe HTML. */
    v(nombre, valor) {
      escena.style.setProperty(nombre, typeof valor === 'number' ? valor.toFixed(4) : valor);
    }
  };
  actos.push(acto);
  return acto;
}

/** Algo que hay que repasar en cada fotograma pase lo que pase: la barra de
 *  arriba, el raíl. Recibe el scroll absoluto. */
export function registrarGlobal(fn) {
  globales.push(fn);
}

/* --------------------------------------------------------------------------
   El bucle
   -------------------------------------------------------------------------- */
function asegurarPreparado(acto) {
  if (acto.listo) return;
  acto.listo = true;
  if (acto.preparar) {
    try { acto.preparar(acto); } catch (e) { console.warn('preparar ' + acto.id, e); }
  }
}

function pintarActo(acto, p) {
  /* Nada de repintar lo mismo: el scroll dispara muchos más eventos que
     fotogramas útiles, y a esta resolución no se nota la diferencia. */
  if (Math.abs(p - acto.ultimo) < 0.0002) return;
  acto.ultimo = p;
  asegurarPreparado(acto);
  try { acto.pintar(p, acto); } catch (e) { console.warn('pintar ' + acto.id, e); }
}

function repasar() {
  const alto = window.innerHeight;

  for (const acto of actos) {
    const caja = acto.el.getBoundingClientRect();
    const cerca = caja.top < alto * 1.5 && caja.bottom > -alto * 0.5;

    if (!cerca) {
      /* Al salir de escena se deja en su fotograma de los extremos, para que
         no se quede congelado a medias si se vuelve a él de un salto. */
      if (acto.activo) {
        acto.activo = false;
        pintarActo(acto, caja.top > 0 ? 0 : 1);
      }
      continue;
    }

    acto.activo = true;
    const recorrido = Math.max(1, caja.height - alto);
    pintarActo(acto, tope(-caja.top / recorrido));
  }

  for (const fn of globales) {
    try { fn(window.scrollY, alto); } catch (e) { console.warn('global', e); }
  }
}

function alHacerScroll() {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(() => {
    pendiente = false;
    repasar();
  });
}

/* --------------------------------------------------------------------------
   Arranque
   -------------------------------------------------------------------------- */
export function arrancar() {
  if (arrancado) return;
  arrancado = true;

  sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('anim');

  if (sinMovimiento) {
    /* Sin movimiento: cada acto en su fotograma final y a leer. Ni scroll ni
       rAF. Es accesibilidad, y no se negocia (NORMAS § 9). */
    for (const acto of actos) {
      asegurarPreparado(acto);
      try { acto.pintar(1, acto); } catch (e) { console.warn('final ' + acto.id, e); }
    }
    for (const fn of globales) {
      try { fn(0, window.innerHeight, true); } catch (e) { console.warn('global', e); }
    }
    return;
  }

  addEventListener('scroll', alHacerScroll, { passive: true });
  addEventListener('resize', alHacerScroll, { passive: true });
  repasar();
}

export function esSinMovimiento() {
  return sinMovimiento;
}
