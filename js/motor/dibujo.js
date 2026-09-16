/* =============================================================================
   motor/dibujo.js · El escenario del dibujo de caricatura
   -----------------------------------------------------------------------------
   🚨 POR QUÉ ESTO NO PERTENECE AL ACTO 3, QUE ES QUIEN LO ESTRENA.

   Es exactamente el mismo motivo por el que el mapa vive en `lienzo.js` y no
   dentro del acto 1: **el coche y la nieve siguen puestos en los actos 4, 5 y
   6**. El acto 3 termina con el coche cruzando un bosque nevado y el acto 4
   empieza justo ahí. Si el dibujo fuera propiedad del acto 3, el acto 4 tendría
   que volver a crearlo en la costura y se vería el salto.

   Así que el dibujo vive UNA sola vez, en una capa fija, y los actos le piden
   cosas. Aquí están todas sus escrituras al DOM, juntas y contadas.

   🚨 Y COMO EL LIENZO: un acto que no use el dibujo tiene que APAGARLO
   (`apagarDibujo`). Lo que un acto no toca se queda como estaba, y al volver
   del acto 3 al 2 el tren se quedaba flotando sobre el mapa de Tokio. Es la
   línea de puntos suelta del 16 de septiembre con otro nombre.
   ============================================================================= */

/* 🚨 LAS RUTAS VAN COMO LITERALES para que `sellar-version.js` las encuentre.
   Si se construyeran a mano (juntando 'arte/' con el nombre) el sellador no
   podría verlas, la URL no cambiaría nunca y una publicación serviría el dibujo
   viejo durante los diez minutos de caché de GitHub Pages. */
const PIEZAS = [
  ['tren', 'arte/tren.svg?v=9b11daa9'],
  ['cuatro', 'arte/cuatro.svg?v=9b11daa9'],
  ['mostrador', 'arte/mostrador.svg?v=9b11daa9'],
  ['llave', 'arte/llave.svg?v=9b11daa9'],
  ['coche', 'arte/coche.svg?v=9b11daa9']
];

const BANDAS = [
  ['ciudad', 'arte/ciudad.svg?v=9b11daa9'],
  ['bosque', 'arte/bosque.svg?v=9b11daa9'],
  ['bosque-nevado', 'arte/bosque-nevado.svg?v=9b11daa9']
];

/* Cuántas veces se repite cada banda en fila. Una copia mide 118vmin de ancho,
   así que TRES cubren la pantalla más el desplazamiento de una entera en
   cualquier proporción razonable, incluida una pantalla de 2.560 px. La cuarta
   que había no se veía nunca y eran ciento veinte nodos de más pintándose en el
   único tramo del acto donde hay dos bandas encendidas a la vez. */
const COPIAS = 3;

let raiz = null;
let fondo = null;
const piezas = new Map();
const bandas = new Map();

/* Lo último que se escribió en cada cosa. El motor ya evita repintar el mismo
   fotograma, pero un acto toca cinco piezas por fotograma y casi todas están
   quietas casi todo el rato: comparar sale más barato que escribir en el DOM. */
const ultimo = new Map();

function poner(el, clave, nombre, valor) {
  const k = clave + nombre;
  if (ultimo.get(k) === valor) return;
  ultimo.set(k, valor);
  el.style.setProperty(nombre, valor);
}

/**
 * 🚨 LO QUE NO SE VE, NO EXISTE.
 * Una pieza a opacidad 0 sigue costando: el navegador la mantiene en su capa y,
 * con `will-change` encima, le reserva memoria de vídeo. En este acto eso son
 * doce SVG de banda —cuatro copias por tres bandas, casi quinientos nodos— y
 * cinco piezas, casi todas apagadas casi todo el rato.
 *
 * Con `hidden` el navegador se las quita de encima enteras. Medido el 17 de
 * septiembre: el acto 3 pasaba de saltarse el 7 % de los fotogramas a no
 * saltarse ninguno, con la CPU frenada 4x. Es la diferencia entre ir bien e ir
 * justo, y este es el acto que más mete en pantalla de los ocho.
 */
function verSiHaceFalta(el, clave, op) {
  const fuera = op <= 0.002;
  if (el.hidden !== fuera) {
    el.hidden = fuera;
    /* 🚨 Y ADEMÁS SE APAGA LA OPACIDAD AL ESCONDER. `hidden` debería bastar,
       pero depende de una regla de CSS que cualquier `display` escrito después
       se lleva por delante —pasó con `.d-banda { display: flex }`—, y entonces
       la pieza reaparece con la opacidad del último fotograma en que se vio.
       Escribirla cuesta una línea y no depende de nadie. */
    if (fuera) poner(el, clave, '--op', '0');
  }
  return !fuera;
}

/* --------------------------------------------------------------------------
   Montaje
   -------------------------------------------------------------------------- */

/**
 * Se llama una vez al arrancar. Si la capa no está en el HTML, todo lo demás
 * sigue funcionando: simplemente no hay dibujo.
 *
 * 🚨 LAS PIEZAS ENTRAN POR `fetch`, NO POR `use` CON REFERENCIA EXTERNA.
 * Safari no carga un `use` que apunte a otro archivo —ni las dos últimas
 * versiones de iOS, que son el objetivo número uno de esta web (NORMAS § 11.3)—
 * y falla en silencio: huecos vacíos y ni un error en consola. Con `fetch` el
 * SVG queda en línea, el CSS le llega por herencia y las puertas del tren se
 * pueden abrir desde fuera, que con una etiqueta de imagen tampoco se podría.
 *
 * Que sea asíncrono no molesta: el acto 3 está a más de veinte pantallas de
 * scroll y las piezas llegan mucho antes. Y si una no llega, el acto sigue
 * corriendo con un hueco en vez de romperse — por eso el guardián comprueba que
 * los ocho archivos existan (comprobar-web.sh).
 */
export function montarDibujo() {
  raiz = document.getElementById('dibujo');
  if (!raiz) return false;

  fondo = raiz.querySelector('.d-fondo');

  for (const par of PIEZAS) {
    const el = raiz.querySelector('[data-pieza="' + par[0] + '"]');
    if (el) piezas.set(par[0], el);
  }
  for (const par of BANDAS) {
    const el = raiz.querySelector('[data-banda="' + par[0] + '"]');
    if (el) bandas.set(par[0], el);
  }

  for (const par of PIEZAS) traer(par[0], par[1], piezas.get(par[0]), 1);
  for (const par of BANDAS) traer(par[0], par[1], bandas.get(par[0]), COPIAS);
  return true;
}

function traer(nombre, ruta, hueco, copias) {
  if (!hueco) return;
  fetch(ruta)
    .then(function (r) { return r.ok ? r.text() : Promise.reject(new Error(String(r.status))); })
    .then(function (svg) { hueco.innerHTML = copias === 1 ? svg : svg.repeat(copias); })
    .catch(function (e) { console.warn('no llegó el dibujo ' + nombre, e); });
}

/* --------------------------------------------------------------------------
   Encender y apagar
   -------------------------------------------------------------------------- */

/** Enciende o apaga la capa entera. */
export function mostrarDibujo(visible) {
  if (raiz) raiz.classList.toggle('en-escena', !!visible);
}

/**
 * 🚨 TODO A CERO. Lo llama CUALQUIER acto que no use el dibujo, en cada
 * fotograma suyo. Es la ley 1 del lienzo aplicada a esta capa: un acto apaga lo
 * que no usa, porque lo que nadie toca se queda encendido.
 */
export function apagarDibujo() {
  if (!raiz) return;
  raiz.classList.remove('en-escena');
  piezas.forEach(function (el, nombre) { verSiHaceFalta(el, nombre, 0); });
  bandas.forEach(function (el, nombre) { verSiHaceFalta(el, nombre, 0); });
}

/* --------------------------------------------------------------------------
   Mover
   -------------------------------------------------------------------------- */

/**
 * Coloca una pieza. `x` va en anchos de pantalla y `y` en altos, los dos
 * respecto a su sitio de reposo sobre la línea del suelo.
 * @param {string} nombre
 * @param {{x?:number, y?:number, op?:number, escala?:number}} c
 */
export function colocar(nombre, c) {
  const el = piezas.get(nombre);
  if (!el) return;
  const op = c.op === undefined ? 1 : c.op;
  /* Una pieza invisible no se mueve ni se pinta */
  if (!verSiHaceFalta(el, nombre, op)) return;
  poner(el, nombre, '--op', op.toFixed(3));
  if (c.x !== undefined) poner(el, nombre, '--x', c.x.toFixed(2));
  if (c.y !== undefined) poner(el, nombre, '--y', c.y.toFixed(2));
  if (c.escala !== undefined) poner(el, nombre, '--s', c.escala.toFixed(3));
}

/**
 * 🚨 EL FINAL DE LA PELÍCULA, POR AHORA: el dibujo se cae al fondo y se
 * desvanece. Lo pidió Kiko el 17 de septiembre: «de repente desaparece y tarda
 * un rato en llegar lo otro… el coche en la nieve se debería caer en el fondo e
 * irse desvaneciendo según se va avanzando».
 *
 * Antes el acto apagaba el dibujo de golpe al salir de su tramo, y entre el
 * corte y el primer texto del capítulo siguiente quedaba una pantalla de nada.
 *
 * `v` va de 0 (el dibujo, en su sitio) a 1 (fuera del todo). Quien lo calcula es
 * principal.js, que es el único que sabe cuánto llevas pasado del final.
 * 🚨 Cuando exista el acto 4 esto NO desaparece: se mueve al último acto que
 * haya, porque la película siempre acaba en alguno.
 */
export function desvanecerDibujo(v) {
  if (!raiz) return;
  const s = v.toFixed(3);
  if (ultimo.get('--fin') === s) return;
  ultimo.set('--fin', s);
  raiz.style.setProperty('--fin', s);
  if (v >= 0.999) apagarDibujo();
}

/** Una variable suelta de la capa entera: --puertas, --halo, --luces. */
export function variable(nombre, valor) {
  if (!raiz) return;
  const v = typeof valor === 'number' ? valor.toFixed(3) : valor;
  if (ultimo.get(nombre) === v) return;
  ultimo.set(nombre, v);
  raiz.style.setProperty(nombre, v);
}

/**
 * Enciende una de las tres bandas de fondo.
 * 🚨 Son tres capas apiladas que se funden entre ellas: así «los mismos
 * árboles, pero nevados» es un fundido de dos dibujos con la MISMA geometría, y
 * no un cambio de golpe. Por eso bosque.svg y bosque-nevado.svg tienen los
 * árboles en las mismas coordenadas exactas, y por eso no se puede mover uno
 * sin mover el otro.
 */
export function verBanda(nombre, op) {
  const el = bandas.get(nombre);
  if (!el || !verSiHaceFalta(el, nombre, op)) return;
  poner(el, nombre, '--op', op.toFixed(3));
}

/**
 * Lo que hace que el coche ande sin moverse: el coche se queda centrado y esto
 * desplaza el fondo. `avance` es un número que crece; se le da la vuelta al
 * llegar al ancho de una copia y, como las copias son idénticas, el bucle no se
 * ve. Cero medidas del DOM: el ancho de la copia lo fija el CSS en vmin.
 */
export function desplazarFondo(avance) {
  if (!fondo) return;
  const v = (((avance % 100) + 100) % 100).toFixed(2);
  if (ultimo.get('--fondo') === v) return;
  ultimo.set('--fondo', v);
  fondo.style.setProperty('--fondo', v);
}
