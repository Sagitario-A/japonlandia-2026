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
  ['tren', 'arte/tren.svg?v=a17f41b7'],
  ['cuatro', 'arte/cuatro.svg?v=a17f41b7'],
  ['mostrador', 'arte/mostrador.svg?v=a17f41b7'],
  ['llave', 'arte/llave.svg?v=a17f41b7'],
  ['coche', 'arte/coche.svg?v=a17f41b7'],
  /* 🚨 EL ACTO 4 EN ADELANTE. Van aquí y no en el acto por lo de siempre: el
     monigote sigue puesto en el acto 5 («el muñequito sigue ahí esquiando») y
     en el 6. Y estando en esta lista, apagarDibujo() los apaga: sin eso, al
     volver del acto 4 al 3 la montaña se quedaba flotando sobre el bosque,
     porque el acto 3 no sabe que existen.
     El tercer campo dice de qué trazado sale el perfil que se muestrea. */
  ['monte', 'arte/monte.svg?v=a17f41b7', '.mo-perfil'],
  /* 🚨 LA TABLA ES UNA PIEZA APARTE DESDE EL ACTO 5, y hasta entonces vivía
     dentro del muñeco. La partió Kiko al describir el acto 5: «se cae de la
     tabla y sube hacia arriba en diagonal». A partir del golpe cada uno va por
     su lado —él por el aire hasta el onsen, ella a la nieve— y dos cosas que se
     mueven por separado no pueden ser el mismo dibujo. Comparten `viewBox` y
     tamaño, así que mientras van pegadas basta con darles la misma x, la misma
     y y el mismo giro: ver arte/tabla.svg. */
  ['tabla', 'arte/tabla.svg?v=a17f41b7'],
  /* 🚨 EL ACTO 5. Y EL ORDEN DE ESTAS TRES NO ES NEGOCIABLE: el onsen está
     partido en dos mitades con el muñeco EN MEDIO, que es lo que hace que se le
     vea metido en el agua y no sentado delante de un barreño. Aquí solo se
     declaran; quien manda de verdad en el orden de pintado es el HTML. */
  /* 🚨 EL ACTO 6 · LA MONTAÑA VA LA PRIMERA DE TODAS, porque es el fondo del
     fondo: más lejos incluso que el bosque. Kiko: «a la derecha una especie de
     montaña que se vea como en la mitad». */
  ['pico', 'arte/pico.svg?v=a17f41b7'],
  ['roca', 'arte/roca.svg?v=a17f41b7'],
  ['onsen-fondo', 'arte/onsen-fondo.svg?v=a17f41b7'],
  ['monigote', 'arte/monigote.svg?v=a17f41b7'],
  ['onsen', 'arte/onsen.svg?v=a17f41b7'],
  /* 🚨 EL ACTO 6. El mono de Jigokudani va DESPUÉS del onsen en esta lista y en
     el HTML, porque entra por delante de todo: se acerca al onsen por la
     derecha, y quien está dentro del agua es el muñeco. Si fuera por detrás, el
     mono aparecería medio tapado por el barreño justo cuando se le tiene que
     ver entero. */
  /* 🚨 Y LA POZA DE LOS MONOS, PARTIDA EN DOS CON EL MONO EN MEDIO, igual que
     el onsen del acto 5 y por el mismo motivo: que se le vea DENTRO del agua.
     poza-fondo · mono · poza, y ese orden no es negociable. */
  /* 🚨 EL HOTEL, Y VA ENTRE EL BOSQUE Y EL ONSEN. Kiko: «que quede detrás del
     onsen con el muñeco y delante de los árboles». Esa posición ES la escena:
     hace que parezca que nos estamos bañando enfrente del edificio. */
  ['yorozuya', 'arte/yorozuya.svg?v=a17f41b7'],
  /* 🚨 LA MONTAÑA DE LOS MONOS, y va DELANTE de los árboles: «que esté como
     traída al frente, de hecho puede estar delante de los árboles». El tercer
     campo dice de qué trazado sale el perfil que se muestrea: el mono BAJA por
     esta ladera, así que su curva se mide del dibujo (ley 18), igual que la
     montaña del acto 4 con el monigote. */
  ['monte-mono', 'arte/monte-mono.svg?v=a17f41b7', '.mm-perfil'],
  ['poza-fondo', 'arte/poza-fondo.svg?v=a17f41b7'],
  ['mono', 'arte/mono.svg?v=a17f41b7'],
  ['poza', 'arte/poza.svg?v=a17f41b7']
];

const BANDAS = [
  ['ciudad', 'arte/ciudad.svg?v=a17f41b7'],
  ['bosque', 'arte/bosque.svg?v=a17f41b7'],
  ['bosque-nevado', 'arte/bosque-nevado.svg?v=a17f41b7']
];

/* Cuántas veces se repite cada banda en fila. Una copia mide 118vmin de ancho,
   así que TRES cubren la pantalla más el desplazamiento de una entera en
   cualquier proporción razonable, incluida una pantalla de 2.560 px. La cuarta
   que había no se veía nunca y eran ciento veinte nodos de más pintándose en el
   único tramo del acto donde hay dos bandas encendidas a la vez. */
const COPIAS = 3;

let raiz = null;
let fondo = null;
let suelo = null;
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
  suelo = raiz.querySelector('.d-suelo');

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
  /* 🚨 Y LA LÍNEA DEL SUELO VUELVE A SU SITIO. El acto 4 la baja hasta el borde
     de abajo de la pantalla para que la montaña de nieve y el bosque compartan
     suelo; si se queda bajada, el acto 1 abre con el mundo pegado al canto
     inferior. Es la ley 16: lo que un acto cambia de una capa compartida, otro
     lo devuelve. */
  bajarSuelo(0);
  zoomEscena(1);
  piezas.forEach(function (el, nombre) { verSiHaceFalta(el, nombre, 0); });
  bandas.forEach(function (el, nombre) { verSiHaceFalta(el, nombre, 0); });
}

/**
 * 🚨 LA LEY 23 APLICADA A LAS PIEZAS: UN ACTO DICE LO QUE SÍ ENSEÑA.
 *
 * Hasta el acto 6, cada acto apagaba lo ajeno NOMBRÁNDOLO a mano —una función
 * `apagarLoDeAntes()` con la lista de las piezas de los actos anteriores—, y esa
 * lista tenía el mismo defecto que tenían las de marcadores: **cada acto tenía
 * que conocer las piezas de los actos que todavía no existen**. La roca nació
 * con el acto 5 y no estaba en ninguna de las listas de los actos 3 y 4; el
 * mono nace con el 6 y no está en ninguna de las cinco anteriores. Saltando
 * desde el raíl, el acto que te saltas no pinta y no recoge nada (ley 20), así
 * que el mono se habría quedado flotando sobre la estación de Shinjuku igual
 * que se quedó el muñeco en su día.
 *
 * Así que se dice al revés: `limpiarPiezas('roca', 'onsen', 'monigote')` y el
 * motor apaga TODAS las demás, existan o no cuando se escribió ese acto. El
 * acto 7 podrá estrenar sus trenes sin tocar una línea de los seis anteriores.
 *
 * 🚨 Las piezas nombradas NO se tocan: las coloca el acto. Si esto las apagara
 * y el acto las volviera a encender, serían dos escrituras al DOM por pieza y
 * por fotograma para dejarlo todo igual.
 */
export function limpiarPiezas() {
  const dejar = arguments;
  piezas.forEach(function (el, nombre) {
    for (let i = 0; i < dejar.length; i++) if (dejar[i] === nombre) return;
    verSiHaceFalta(el, nombre, 0);
  });
}

/**
 * 🚨 Y LA LEY 23 APLICADA A LAS POSTURAS, QUE ES LO MISMO CON OTRA CARA.
 *
 * El muñeco tiene tres posturas —en la tabla, en el onsen, corriendo— y va a
 * tener más. El primer montaje del acto 5 lo resolvió con una variable `--pose`
 * de 0 a 1, y para el acto 6 la salida fácil era añadir un `--corre` al lado.
 * Lo paró Kiko antes de que se escribiera: *«funciona hoy y es otra lista que
 * crece: el acto 7 añadirá otra postura y habrá tres variables que nadie apaga.
 * Dale la vuelta igual que hiciste con los marcadores»*. Tenía razón: una
 * variable que un acto enciende y ningún otro sabe que existe es exactamente el
 * punto de Kusatsu colado sobre el globo.
 *
 * Así que el acto declara la postura que SÍ enseña y el motor apaga las demás.
 * Y la lista de posturas **no está escrita en ningún sitio**: sale del propio
 * dibujo, de los grupos que llevan `data-postura` dentro del `.svg`. Añadir una
 * postura es añadir un grupo al dibujo, y nada más. Es la ley 18 —una sola
 * fuente, y es el dibujo— cruzada con la 23.
 *
 * 🚨 Y se apaga con `display`, no con opacidad: una postura invisible a
 * opacidad 0 sigue costando capa (ley 14). Pasa una o dos veces por acto, así
 * que no hay nada que optimizar.
 */
export function postura(pieza, cual) {
  const el = piezas.get(pieza);
  if (!el) return;
  const k = pieza + ':postura';
  if (ultimo.get(k) === cual) return;
  ultimo.set(k, cual);
  const grupos = el.querySelectorAll('[data-postura]');
  for (const g of grupos) {
    /* 🚨 `inline` Y NO CADENA VACÍA, y esto costó que el muñeco desapareciera
       del acto 6 entero. Vaciar el estilo en línea no enciende nada: deja que
       vuelva a mandar la hoja de estilo, y ahí las posturas que no son la de
       reposo están en `display: none` justo para que no salgan las tres
       apiladas antes del primer pintado. O sea que la postura elegida se
       apagaba a sí misma. Se vio en la primera captura: onsen, roca y tabla en
       su sitio, y dentro del agua no había nadie. */
    g.style.display = g.getAttribute('data-postura') === cual ? 'inline' : 'none';
  }
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
     montaña y el monigote—, así que para las cinco piezas del acto 3 no
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

/**
 * 🚨 EL ZOOM OUT DE LA ESCENA ENTERA. Lo pidió Kiko viendo el acto 6 publicado:
 * *«cuando se esté acabando Yamanouchi, la escena donde estamos debería hacer
 * zoom out»*, para que quepan el coche a la izquierda y una montaña a la
 * derecha. `z` va de 1 (tamaño natural) a menos.
 *
 * 🚨 SE ESCRIBE EL `transform` DE LA CAPA, NO UNA VARIABLE CSS, y esa es toda
 * la diferencia entre que esto cueste algo o no cueste nada. La ley 19 dice que
 * una variable que cambia en cada fotograma no se escribe en la raíz de una
 * capa con hijos animados, porque **una propiedad personalizada se hereda** y
 * al cambiarla el navegador tiene que recalcular el estilo de los cuarenta y
 * cuatro copos. `transform` no se hereda: se escribe en la capa y no invalida a
 * nadie de dentro. Es la excepción a la ley 19, y solo lo es porque no es una
 * variable.
 *
 * 🚨 Y EL ORIGEN ESTÁ EN EL CENTRO DE LA PANTALLA, NO EN EL SUELO, que es lo
 * que hace que la escena funcione: encogiendo desde el borde de abajo, el suelo
 * se queda pegado al canto y delante del muñeco no hay sitio para nada.
 * Encogiendo desde el centro, **la línea del suelo sube** y deja una franja de
 * papel en blanco por delante — que es justo adonde salta el mono cuando «baja
 * hacia nosotros».
 */
export function zoomEscena(z) {
  if (!raiz) return;
  const v = z.toFixed(4);
  if (ultimo.get('zoom') === v) return;
  ultimo.set('zoom', v);
  if (z >= 0.9999) {
    raiz.style.transform = '';
    raiz.style.transformOrigin = '';
  } else {
    raiz.style.transformOrigin = '50% 50%';
    raiz.style.transform = 'scale(' + v + ')';
  }
}

/**
 * 🚨 BAJAR LA LÍNEA DEL SUELO, Y POR QUÉ ESTO NO ES UNA `variable()` MÁS.
 * El acto 4 baja el paisaje hasta el borde de abajo de la pantalla, y eso es un
 * número que cambia en CADA fotograma durante pantalla y pico. Escribirlo en la
 * capa entera —que es lo que hace variable()— invalida el estilo de todo lo que
 * cuelga de ella, y de ella cuelgan los cuarenta y cuatro copos animados: el
 * acto pasaba del 1 % de fotogramas saltados al 4 %, sin pintar nada nuevo. Es
 * la ley 15 por la puerta de atrás.
 *
 * Escrito pieza a pieza son nueve elementos pequeños y la nevada no se entera.
 * Medido: vuelve al 0 %.
 */
export function bajarSuelo(px) {
  const v = px.toFixed(1) + 'px';
  if (ultimo.get('--baja-px') === v) return;
  ultimo.set('--baja-px', v);
  if (fondo) fondo.style.setProperty('--baja-px', v);
  if (suelo) suelo.style.setProperty('--baja-px', v);
  piezas.forEach(function (el) { el.style.setProperty('--baja-px', v); });
}

/**
 * Una variable de UNA pieza, no de la capa entera.
 *
 * ⚠️ HOY NO LA USA NADIE, y conviene saberlo antes de fiarse del párrafo de
 * abajo: nació para la postura del muñeco del acto 5, y el acto 6 se llevó esa
 * postura a `postura()`, que hace lo mismo sin variables. Se queda porque el
 * motivo por el que existe sigue siendo verdad y volverá a hacer falta el día
 * que algo que cambia en cada fotograma tenga que escribirse en una pieza.
 * 🚨 Si se borra, que se borre por estar muerta y no por «limpiar»: el 16 de
 * septiembre se quitó `tope` de principal.js por eso y el final de la película
 * dejó de ejecutarse entero, sin que saltara ninguna comprobación.
 *
 * 🚨 ES LA LEY 19, Y ES LA RAZÓN POR LA QUE ESTO EXISTE. `variable()`
 * escribe en la raíz de la capa, y de la raíz cuelgan los cuarenta y cuatro
 * copos animados: cada escritura les recalcula el estilo a todos. Para algo que
 * cambia una vez por acto da igual, pero el acto 5 mueve la postura del muñeco
 * y el rebote del onsen DENTRO de la caída, o sea en cada fotograma durante
 * pantalla y media. Escrito en la pieza, la nevada no se entera.
 *
 * Lo mismo que hace bajarSuelo() con el paisaje, pero para una sola pieza.
 */
export function variableDe(pieza, nombre, valor) {
  const el = piezas.get(pieza);
  if (!el) return;
  poner(el, pieza, nombre, typeof valor === 'number' ? valor.toFixed(3) : valor);
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
   El perfil de una pieza · por dónde va el monigote
   --------------------------------------------------------------------------
   🚨 UNA SOLA FUENTE, Y ES EL DIBUJO. La montaña del acto 4 tiene un monigote
   esquiándola por encima, y el monigote necesita saber a qué altura está la
   nieve en cada punto. La tentación es escribir la curva dos veces —la campana
   en el SVG y la misma campana en el JavaScript del acto— y eso se desincroniza
   el día que alguien retoque el perfil: la montaña cambia de forma, el
   monigote no, y se queda flotando sin que nadie sepa por qué.

   Así que el perfil se MIDE del trazado de verdad, con getPointAtLength, una
   sola vez: en cuanto llega el archivo. Retocar arte/monte.svg mueve al
   monigote con él, sin tocar una línea de código.
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
