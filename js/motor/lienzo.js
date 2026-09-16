/* =============================================================================
   motor/lienzo.js · El escenario compartido
   -----------------------------------------------------------------------------
   🚨 POR QUÉ ESTO NO PERTENECE A NINGÚN ACTO.

   El globo aparece en el acto 1 y sigue ahí en el acto 2, ampliándose hasta ser
   el mapa de Japón. Si cada acto tuviera su propio mapa habría que fundir uno
   con otro justo en la costura, y se vería. Así que el mapa vive UNA sola vez,
   en una capa fija, y los actos le dicen dónde mirar.

   Aquí están todas las escrituras al DOM del dibujo, juntas y contadas. Los
   actos no tocan elementos: piden.

   🚨 El JavaScript no escribe contenido. Los rótulos de los marcadores —Madrid,
   Narita, Meidaimae— están escritos en el HTML; aquí solo se mueven.
   ============================================================================= */

import { proyectarGrados, px, py, radioActual, trazar, ajustarViewport } from './proyeccion.js?v=235063c6';
import { dibujarCostas, dibujarReticula, opacidadReticula, dibujarCalles, opacidadCalles, dibujarAutopistas, opacidadAutopistas } from './mapa.js?v=235063c6';
import { trazarRuta, cabezaDeRuta } from './ruta.js?v=235063c6';
import { r1 } from './util.js?v=235063c6';

let raiz = null;
let svg = null;
let capasCosta = [];
let pathReticula = null;
let pathCalles = null;
let pathAutopistas = null;
let limbo = null;
let capasRuta = [];
const hitos = new Map();

/**
 * Estira el viewBox para que ocupe la pantalla entera.
 * 🚨 Con un viewBox cuadrado, en un móvil el mapa vivía en el cuadrado central
 * y sobraba media pantalla en blanco. Ahora el lado corto vale 260 unidades y
 * el largo se estira, así que el globo sigue cabiendo y en vertical se gana
 * todo. Ver proyeccion.js.
 */
function encajarViewport() {
  if (!svg) return;
  svg.setAttribute('viewBox', ajustarViewport(window.innerWidth, window.innerHeight));
}

/** Se llama una vez, al arrancar. Si el escenario no está en el HTML, todo lo
 *  demás sigue funcionando: simplemente no se dibuja nada. */
export function montarLienzo() {
  raiz = document.getElementById('escenario');
  if (!raiz) return false;

  svg = raiz.querySelector('svg');
  encajarViewport();
  addEventListener('resize', encajarViewport, { passive: true });

  pathReticula = raiz.querySelector('[data-mapa="reticula"]');
  pathCalles = raiz.querySelector('[data-mapa="calles"]');
  pathAutopistas = raiz.querySelector('[data-mapa="autopistas"]');
  limbo = raiz.querySelector('[data-mapa="limbo"]');
  capasCosta = Array.from(raiz.querySelectorAll('[data-mapa="costa"]'));
  capasRuta = Array.from(raiz.querySelectorAll('[data-mapa="ruta"]'));

  for (const g of raiz.querySelectorAll('[data-hito]')) {
    hitos.set(g.getAttribute('data-hito'), g);
  }
  return true;
}

/** Enciende o apaga el escenario entero. */
export function mostrarLienzo(visible) {
  if (raiz) raiz.classList.toggle('en-escena', !!visible);
}

/**
 * 🚨 EL MAPA PEQUEÑO. Encoge el escenario entero y lo sube, para que quepa
 * arriba mientras el dibujo de caricatura ocupa la parte de abajo.
 *
 * Lo pidió Kiko el 17 de septiembre para el viaje en coche: «que aparezca la
 * silueta del mapa de Japón, y lo mismo que con las líneas de metro, pero con
 * las carreteras hasta el primer punto».
 *
 * Es la misma capa de siempre —no hay un segundo mapa ni una segunda cámara—:
 * solo se dibuja más pequeña. Con eso, el zoom, las rutas y los marcadores
 * siguen funcionando exactamente igual.
 */
export function empequeñecerMapa(v) {
  if (!raiz) return;
  raiz.style.setProperty('--mini', v.toFixed(3));
}

/** Lo mismo que desvanecerDibujo(), para la capa del mapa: al acabar la
 *  pelicula, el mapa pequenio del viaje al norte tambien se tiene que ir. */
export function desvanecerMapa(v) {
  if (raiz) raiz.style.setProperty('--fin', v.toFixed(3));
}

/** La opacidad global del mapa, para poder disolverlo al final de un acto. */
export function opacidadMapa(v) {
  if (raiz) raiz.style.setProperty('--opacidad-mapa', v.toFixed(3));
}

/**
 * Cuánto ha subido la Tierra desde abajo: 0 abajo del todo, 1 en su sitio.
 * 🚨 Existe porque al reconstruir la web se perdió por el camino: el globo se
 * limitaba a aparecer por opacidad, y lo que Kiko pidió es que **suba** por
 * detrás del título mientras bajas, que es lo que hace que parezca una sola
 * página y no dos pantallas pegadas.
 */
export function alzarLienzo(v) {
  if (raiz) raiz.style.setProperty('--p-alzado', v.toFixed(3));
}

/* --------------------------------------------------------------------------
   El mapa
   -------------------------------------------------------------------------- */

/**
 * Redibuja costas y retícula con la cámara donde esté ahora.
 * Llamarlo DESPUÉS de mover la cámara y ANTES de colocar rutas y marcadores.
 */
export function pintarMapa() {
  if (!raiz) return;

  const capas = dibujarCostas();
  for (let i = 0; i < capasCosta.length; i++) {
    const c = capas[i];
    capasCosta[i].setAttribute('d', c ? c.d : '');
    capasCosta[i].style.opacity = c ? c.opacidad.toFixed(3) : '0';
  }

  /* Las autopistas: el relevo entre la costa y el callejero, para que no haya
     ni un tramo de zoom con el mapa en blanco. Ver mapa.js. */
  if (pathAutopistas) {
    const opRed = opacidadAutopistas();
    pathAutopistas.setAttribute('d', opRed > 0.001 ? dibujarAutopistas() : '');
    pathAutopistas.style.opacity = opRed.toFixed(3);
  }

  /* El callejero: entra cuando la costa se está yendo, para que el final del
     zoom no sea una pantalla en blanco. Se dibuja ANTES que las rutas para que
     la línea de la operadora quede por encima: la ruta es el dato, la calle es
     el contexto. */
  if (pathCalles) {
    const opCalles = opacidadCalles();
    pathCalles.setAttribute('d', opCalles > 0.001 ? dibujarCalles() : '');
    pathCalles.style.opacity = opCalles.toFixed(3);
  }

  const opReticula = opacidadReticula();
  if (pathReticula) {
    pathReticula.setAttribute('d', opReticula > 0.001 ? dibujarReticula() : '');
    pathReticula.style.opacity = opReticula.toFixed(3);
  }

  /* El limbo —el borde del planeta— solo tiene sentido mientras se ve como
     planeta. En cuanto es un mapa, un círculo enorme sobra. */
  if (limbo) {
    const r = radioActual();
    limbo.setAttribute('r', r1(r));
    limbo.style.opacity = opReticula.toFixed(3);
  }
}

/* --------------------------------------------------------------------------
   Las rutas
   -------------------------------------------------------------------------- */

/**
 * Dibuja una ruta en la capa `indice` (0, 1, 2…), trazada hasta `avance`.
 * `estilo` opcional: { color, guion, opacidad }.
 */
export function pintarRuta(indice, ruta, avance, estilo) {
  const el = capasRuta[indice];
  if (!el) return;

  const op = estilo && estilo.opacidad !== undefined ? estilo.opacidad : 1;
  if (avance <= 0 || op <= 0.002) {
    /* La opacidad también, no solo el trazo: dejarla a medias es una mentira
       esperando a que alguien la lea al depurar. */
    el.setAttribute('d', '');
    el.style.opacity = '0';
    return;
  }
  el.setAttribute('d', trazarRuta(ruta, avance));
  el.style.opacity = op.toFixed(3);
  if (estilo && estilo.color) el.style.stroke = estilo.color;
  if (estilo && estilo.guion !== undefined) {
    el.style.strokeDasharray = estilo.guion ? '0.5 6' : 'none';
  }
}

/** Borra las capas de ruta que no se estén usando. */
export function limpiarRutas(desde) {
  for (let i = desde; i < capasRuta.length; i++) capasRuta[i].setAttribute('d', '');
}

/**
 * Coloca un vehículo en la cabeza de una ruta, girado hacia donde va.
 * Se esconde en los extremos: un avión parado en el origen no cuenta nada.
 */
export function pintarVehiculo(nombre, ruta, avance) {
  const el = hitos.get(nombre);
  if (!el) return;

  const c = (avance > 0.015 && avance < 0.995) ? cabezaDeRuta(ruta, avance) : null;
  if (!c) { el.style.opacity = '0'; return; }

  el.setAttribute('transform',
    'translate(' + r1(c.x) + ' ' + r1(c.y) + ') rotate(' + r1(c.angulo + 90) + ')');
  el.style.opacity = '1';
}

/* --------------------------------------------------------------------------
   Los marcadores
   -------------------------------------------------------------------------- */

/**
 * Pone un marcador en unas coordenadas. `opacidad` permite hacerlo aparecer.
 * Si el punto cae en la cara oculta del planeta, se esconde solo.
 */
export function marcar(nombre, lonlat, opacidad = 1) {
  const el = hitos.get(nombre);
  if (!el) return;

  if (opacidad <= 0.001 || !proyectarGrados(lonlat[0], lonlat[1])) {
    el.style.opacity = '0';
    return;
  }
  el.setAttribute('transform', 'translate(' + r1(px) + ' ' + r1(py) + ')');
  el.style.opacity = opacidad.toFixed(3);
}

/** Esconde un marcador sin moverlo. */
export function esconder(nombre) {
  const el = hitos.get(nombre);
  if (el) el.style.opacity = '0';
}

/**
 * 🚨 APAGA TODOS LOS MARCADORES QUE NO SEAN DE ESTE ACTO. Se le pasan los que
 * SÍ se ven; el resto se apagan, existan o no cuando se escribió el acto.
 *
 * POR QUÉ EXISTE, que es un fallo que encontró Kiko subiendo el scroll:
 * el punto de Kusatsu se quedaba encendido sobre el mapa hasta el principio de
 * la película, flotando encima del globo durante el vuelo a Madrid. Y de vez en
 * cuando también el de Takaragawa, en el mapa del acto 3.
 *
 * La causa no era el acto 5: era que cada acto escondía una lista de marcadores
 * ESCRITA A MANO —`esconder('madrid')`, `esconder('narita')`…—, o sea que cada
 * acto tenía que saber los nombres de los marcadores de todos los actos
 * FUTUROS. Kusatsu nació con el acto 5 y no estaba en ninguna de las cuatro
 * listas anteriores, así que nadie lo apagaba nunca. Con ocho actos eso no es
 * un descuido: es una cuenta que no se puede llevar.
 *
 * Al revés sí se puede: un acto sabe perfectamente cuáles son SUS marcadores.
 * Es la ley 1 —un acto apaga lo que no usa— dicha de la única forma que
 * sobrevive a que aparezcan marcadores nuevos. Es lo mismo que hace
 * `limpiarRutas(n)` con las capas de ruta, y por la misma razón.
 *
 * 🚨 EL ACTO 6 VA A AÑADIR YAMANOUCHI, y el 7 y el 8 los suyos: con esto, no
 * hay que tocar ningún acto anterior. Sin esto, hay que acordarse de tocarlos
 * todos.
 */
export function limpiarHitos() {
  const dejar = arguments;
  hitos.forEach(function (el, nombre) {
    for (let i = 0; i < dejar.length; i++) if (dejar[i] === nombre) return;
    /* Comparar antes de escribir: esto corre en cada fotograma de la película y
       casi siempre no hay nada que apagar. */
    if (el.style.opacity !== '0') el.style.opacity = '0';
  });
}

/**
 * Cierra el halo de un marcador de destino.
 * 🚨 Existe porque el último tramo —tres minutos andando, 200 metros— mide
 * medio píxel a cualquier escala en la que se vea el resto del trayecto. Una
 * línea que no se ve no cuenta nada; un halo que se cierra sobre el portal, sí.
 * `cerca` va de 0 (el tramo no ha empezado) a 1 (se ha llegado).
 *
 * 🚨 Es un PULSO, no un cierre: en reposo el halo es pequeño, se abre a mitad
 * del recorrido y vuelve a cerrarse al llegar. La primera versión lo tenía al
 * revés —ancho mientras el tramo aún no había empezado— y a la escala de la
 * ruta ese círculo de veintidós unidades se comía la etiqueta de Shinjuku justo
 * en el momento en que esa etiqueta era lo único importante de la pantalla.
 */
export function cerrarHalo(nombre, cerca) {
  const el = hitos.get(nombre);
  if (!el) return;
  const halo = el.querySelector('.m-halo');
  if (halo) halo.setAttribute('r', r1(6 + 20 * Math.sin(Math.PI * cerca)));
}
