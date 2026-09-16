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
  ['tren', 'arte/tren.svg?v=cfb77c51'],
  ['cuatro', 'arte/cuatro.svg?v=cfb77c51'],
  ['mostrador', 'arte/mostrador.svg?v=cfb77c51'],
  ['llave', 'arte/llave.svg?v=cfb77c51'],
  ['coche', 'arte/coche.svg?v=cfb77c51'],
  /* 🚨 EL ACTO 4 EN ADELANTE. Van aquí y no en el acto por lo de siempre: el
     esquiador sigue puesto en el acto 5 («el muñequito sigue ahí esquiando») y
     en el 6. Y estando en esta lista, apagarDibujo() los apaga: sin eso, al
     volver del acto 4 al 3 la montaña se quedaba flotando sobre el bosque,
     porque el acto 3 no sabe que existen.
     El tercer campo dice de qué trazado sale el perfil que se muestrea. */
  ['monte', 'arte/monte.svg?v=cfb77c51', '.mo-perfil'],
  ['esquiador', 'arte/esquiador.svg?v=cfb77c51']
];

const BANDAS = [
  ['ciudad', 'arte/ciudad.svg?v=cfb77c51'],
  ['bosque', 'arte/bosque.svg?v=cfb77c51'],
  ['bosque-nevado', 'arte/bosque-nevado.svg?v=cfb77c51']
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

/* Las tablas de altura de las piezas que tienen perfil. Hoy solo la montaña.
   Ver muestrearPerfil() al final del archivo. */
const perfiles = new Map();

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

  for (const par of PIEZAS) traer(par[0], par[1], piezas.get(par[0]), 1, par[2]);
  for (const par of BANDAS) traer(par[0], par[1], bandas.get(par[0]), COPIAS);
  return true;
}

function traer(nombre, ruta, hueco, copias, selPerfil) {
  if (!hueco) return;
  fetch(ruta)
    .then(function (r) { return r.ok ? r.text() : Promise.reject(new Error(String(r.status))); })
    .then(function (svg) {
      hueco.innerHTML = copias === 1 ? svg : svg.repeat(copias);
      /* En cuanto el dibujo está puesto, y UNA sola vez en toda la página */
      if (selPerfil) {
        const tabla = muestrearPerfil(hueco, selPerfil);
        if (tabla) perfiles.set(nombre, tabla);
      }
    })
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
  /* Los dos últimos solo los mira quien los use en su regla de CSS —hoy la
     montaña y el esquiador—, así que para las cinco piezas del acto 3 no
     cambia absolutamente nada. */
  if (c.escalaX !== undefined) poner(el, nombre, '--sx', c.escalaX.toFixed(3));
  if (c.giro !== undefined) poner(el, nombre, '--g', c.giro.toFixed(1));
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

/* --------------------------------------------------------------------------
   El perfil de una pieza · por dónde va el esquiador
   --------------------------------------------------------------------------
   🚨 UNA SOLA FUENTE, Y ES EL DIBUJO. La montaña del acto 4 tiene un monigote
   esquiándola por encima, y el monigote necesita saber a qué altura está la
   nieve en cada punto. La tentación es escribir la curva dos veces —la campana
   en el SVG y la misma campana en el JavaScript del acto— y eso se desincroniza
   el día que alguien retoque el perfil: la montaña cambia de forma, el
   esquiador no, y se queda flotando sin que nadie sepa por qué.

   Así que el perfil se MIDE del trazado de verdad, con getPointAtLength, una
   sola vez: en cuanto llega el archivo. Retocar arte/monte.svg mueve al
   esquiador con él, sin tocar una línea de código.
   -------------------------------------------------------------------------- */

/* Cuántas casillas tiene la tabla, repartidas a lo ancho. Con 64 el error
   máximo contra la curva de verdad es de una milésima de la altura: por debajo
   de un píxel en cualquier pantalla. */
const MUESTRAS = 64;
/* Cuántos puntos se le piden al trazado. Van repartidos por LARGO DE CURVA, así
   que hacen falta bastantes más que casillas para que las laderas empinadas
   —donde muchos milímetros de curva son pocos de anchura— no queden ralas. */
const PASADAS = 320;

function muestrearPerfil(hueco, selector) {
  const trazo = hueco.querySelector(selector);
  const svg = hueco.querySelector('svg');
  if (!trazo || !svg || typeof trazo.getTotalLength !== 'function') return null;

  const caja = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  const ancho = caja[2];
  const alto = caja[3];
  if (!(ancho > 0) || !(alto > 0)) return null;

  /* 🚨 SE MIDE CON LA PIEZA ENCENDIDA. Esta capa apaga con `hidden`, que es
     `display: none`, y dentro de un subárbol que no se maqueta getPointAtLength
     puede devolver ceros —WebKit lo hace— sin dar ningún error. Se enciende un
     instante, se mide y se deja como estaba. Pasa UNA vez en toda la vida de la
     página, y la pieza está a opacidad 0 mientras tanto: no se ve nada. */
  const oculto = hueco.hidden;
  hueco.hidden = false;

  const bruto = [];
  try {
    const largo = trazo.getTotalLength();
    if (largo > 0) {
      for (let i = 0; i <= PASADAS; i++) {
        const punto = trazo.getPointAtLength((largo * i) / PASADAS);
        /* Normalizado: x de 0 a 1 de izquierda a derecha, altura de 0 (el
           suelo) a 1 (lo alto de la caja). Así la tabla no sabe nada de
           píxeles y sirve igual en un móvil que en un portátil. */
        bruto.push([punto.x / ancho, 1 - punto.y / alto]);
      }
    }
  } catch (e) {
    console.warn('no se pudo medir el perfil ' + selector, e);
  }

  hueco.hidden = oculto;
  if (bruto.length < 2) return null;

  /* 🚨 DE LARGO DE ARCO A ANCHURA. getPointAtLength reparte los puntos por lo
     que mide la curva, así que se amontonan en las laderas y escasean en la
     cima. El acto pregunta por x —«¿a qué altura está la nieve aquí?»—, así que
     la tabla se rehace con las casillas repartidas a lo ancho. Luego leerla es
     una división y una interpolación, sin buscar nada por el camino. */
  const tabla = new Float64Array(MUESTRAS + 1);
  let j = 0;
  for (let i = 0; i <= MUESTRAS; i++) {
    const x = i / MUESTRAS;
    while (j < bruto.length - 2 && bruto[j + 1][0] < x) j++;
    const a = bruto[j];
    const b = bruto[j + 1];
    const hueco2 = b[0] - a[0];
    let t = hueco2 > 1e-9 ? (x - a[0]) / hueco2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    tabla[i] = a[1] + (b[1] - a[1]) * t;
  }
  return tabla;
}

/**
 * La tabla de alturas de una pieza, o null si todavía no ha llegado su dibujo.
 * 🚨 Se pregunta en cada fotograma a propósito, y no una vez al preparar el
 * acto: el `fetch` es asíncrono y el acto puede haberse preparado antes. Es una
 * consulta a un Map, que no cuesta nada.
 *
 * `altura(tabla, x)` la lee: `x` de 0 (borde izquierdo de la pieza) a 1
 * (derecho), y devuelve de 0 (suelo) a 1 (lo alto de la caja).
 */
export function perfilDe(nombre) {
  return perfiles.get(nombre) || null;
}

export function altura(tabla, x) {
  if (!tabla) return 0;
  if (x <= 0 || x >= 1) return 0;
  const t = x * MUESTRAS;
  const i = t | 0;
  const f = t - i;
  return tabla[i] + (tabla[i + 1] - tabla[i]) * f;
}
