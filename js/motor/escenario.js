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

import { tope } from './util.js?v=db2e7560';

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
 * @param {Function} [def.salir]     se llama al SALIR del tramo, una sola vez
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
    salir: def.salir,
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
    const recorrido = Math.max(1, caja.height - alto);
    const bruto = -caja.top / recorrido;

    /* 🚨 UN ACTO PINTA SOLO DENTRO DE SU PROPIO TRAMO DE SCROLL, de 0 a 1.
       No vale con «está cerca». El lienzo es compartido y el último que pinta
       manda, así que un acto que aún no ha empezado y se adelanta a pintar su
       fotograma cero mueve la cámara y dibuja encima del que sí está en curso:
       con el avión todavía a medio camino, el acto 2 ya colaba la ruta entera
       del vuelo y movía el globo cinco grados.
       Como los tramos son contiguos y casan en la costura, en cada momento hay
       exactamente uno con el mando. */
    const cerca = bruto >= 0 && bruto <= 1;

    if (!cerca) {
      /* 🚨 UN ACTO FUERA DE PANTALLA NO PINTA. NUNCA.
         Aquí había un repintado «de cortesía» al salir de escena, para dejar el
         acto en su fotograma de los extremos. Con el mapa en una capa fija y
         compartida eso es veneno: el acto que se va movía la cámara y dibujaba
         encima de lo que el acto activo acababa de pintar. Subiendo el scroll
         de vuelta al vuelo, el acto 2 se despedía redibujando la ruta con SU
         cámara y dejaba una línea de puntos suelta flotando sobre el globo.
         Kiko la vio. No hace falta el repintado: cada acto escribe todo su
         estado en cuanto vuelve a entrar.

         🚨 Y SE OLVIDA DE LO QUE PINTÓ. `ultimo` existe para no repintar dos
         veces el mismo fotograma, pero el lienzo es compartido: mientras este
         acto estaba fuera, otro lo ha borrado y ha pintado lo suyo. Si al
         volver al MISMO punto de scroll se diera por pintado, no repintaría y
         se vería el mapa del otro acto. Pasa al subir el scroll y volver a
         entrar por donde saliste, que es justo lo que uno hace al revisar. */
      /* 🚨 Y RECOGE LO QUE DEJÓ ESCRITO EN EL HTML.
         Olvidar el último fotograma hace que el acto se repinte al volver, pero
         NO deshace lo que ya escribió en la página. Y los actos se solapan una
         pantalla entera por el margen negativo de la ley 7, así que la escena
         del acto siguiente está en pantalla mientras el anterior termina: el
         rótulo final del acto 3 —«empieza a nevar»— salía impreso encima del
         panel del alojamiento del acto 2, las dos cosas a la vez y las dos
         ilegibles. Es la línea de puntos suelta del 16 de septiembre otra vez,
         ahora con texto.
         Un acto que escriba en el HTML implementa `salir()` y lo borra ahí. */
      if (acto.activo && acto.salir) {
        try { acto.salir(acto); } catch (e) { console.warn('salir ' + acto.id, e); }
      }
      acto.activo = false;
      acto.ultimo = -1;
      continue;
    }

    acto.activo = true;
    pintarActo(acto, tope(bruto));
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
