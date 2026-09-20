/* =============================================================================
   actos/02-llegada.js · De Narita a un portal de Setagaya
   -----------------------------------------------------------------------------
   🚨 EL ACTO QUE DECIDE SI TODO ESTO ES VIABLE.

   Kiko lo pidió así: «en vez de desplazar la tierra hacia arriba, lo que tiene
   que hacer es ampliar el mapa poco a poco hasta que se queda el mapa de
   Japón». Y luego, «antes de que se resalte nuestro primer alojamiento, que se
   haga un poco de zoom para dejar toda la zona central de Japón, que es Kanto».

   Todo el zoom —del globo a Japón, de Japón a Kantō, de Kantō a la calle— es la
   MISMA proyección con el radio subiendo. Ver motor/proyeccion.js y NORMAS § 9.

   Guion → web-nueva/DEFINICION.md, acto A2.
   ============================================================================= */

import { registrarActo } from '../motor/escenario.js?v=822ac628';
import { tramo, suave, tope } from '../motor/util.js?v=822ac628';
import { encuadrar, viajarDeVista } from '../motor/proyeccion.js?v=822ac628';
import { pintarMapa, pintarRuta, limpiarRutas, marcar, mostrarLienzo, opacidadMapa, cerrarHalo, alzarLienzo, empequeñecerMapa, limpiarHitos } from '../motor/lienzo.js?v=822ac628';
import { tenderRuta } from '../motor/ruta.js?v=822ac628';
import { apagarDibujo } from '../motor/dibujo.js?v=822ac628';
import { LUGARES, TRAMOS_LLEGADA, ENCUADRES } from '../datos/rutas.js?v=822ac628';
import { VISTA_FINAL, RUTA_VUELO } from './01-vuelo.js?v=822ac628';

/* --------------------------------------------------------------------------
   Los encuadres, en el orden en que los recorre la cámara
   --------------------------------------------------------------------------
   `encuadrar(grados)` traduce «quiero ver 26 grados de ancho» a un radio. Es
   más humano que escribir radios, y así los números de arriba se leen.
   -------------------------------------------------------------------------- */
function vista(clave) {
  const e = ENCUADRES[clave];
  return [e[0], e[1], encuadrar(e[2])];
}

const V_GLOBO = VISTA_FINAL;
const V_JAPON = vista('japon');
const V_KANTO = vista('kanto');
const V_RUTA = vista('ruta');
const V_CERCA = vista('cerca');

/* Las tres patas del trayecto, tendidas una vez. */
const PATAS = TRAMOS_LLEGADA.map((t) => ({
  def: t,
  ruta: tenderRuta(t.pasos, 0.2)
}));

/* 🚨 CUÁNTO SCROLL SE LLEVA CADA PATA.
   Repartir por minutos a secas es lo honesto pero no se puede mirar: el Narita
   Express son 82 de los 92 minutos, así que la línea Keio y los tres minutos
   andando pasaban en un parpadeo y sus fichas ni se leían. Y repartir a partes
   iguales miente al revés: los tres minutos durarían lo mismo que la hora y
   veinte de tren.

   El reparto lleva un suelo del 18 %: sigue mandando la duración real, pero lo
   corto tiene tiempo de contarse. La duración exacta la dice la ficha. */
const SUELO = 0.18;
const MINUTOS = PATAS.reduce((s, p) => s + p.def.minutos, 0);
const PESOS = PATAS.map((p) => SUELO + (1 - SUELO) * (p.def.minutos / MINUTOS));
const SUMA = PESOS.reduce((a, b) => a + b, 0);

let corte = 0;
PATAS.forEach((pata, i) => {
  pata.desde = corte;
  corte += PESOS[i] / SUMA;
  pata.hasta = corte;
});

let fichas = [];
let paradas = [];

/* 🚨 EL GUION DEL TEXTO DE ABAJO, en `p` de este acto.
   No se deriva de las patas de la ruta, aunque lo parezca. Tiene que
   ALTERNARSE con los anuncios de parada —punto, linea, ficha, punto, linea,
   ficha— y derivarlo daba dos fallos que se vieron en la tabla de estados:
   un hueco sin nada de texto mientras la linea ya corria, y luego el anuncio
   de Meidaimae impreso ENCIMA de la ficha del Narita Express, porque las dos
   viven en la misma celda de la rejilla.
   Con ventanas explicitas y encadenadas no se pisa ninguna. */
const GUION = [
  { lista: 'parada', i: 0, de: 0.320, a: 0.445 },   /* «Primera conexion · Shinjuku» */
  { lista: 'ficha',  i: 0, de: 0.425, a: 0.580 },   /* Narita Express */
  { lista: 'parada', i: 1, de: 0.565, a: 0.655 },   /* «Segunda conexion · Meidaimae» */
  { lista: 'ficha',  i: 1, de: 0.640, a: 0.710 },   /* Linea Keio */
  { lista: 'ficha',  i: 2, de: 0.700, a: null }     /* A pie · lo releva el panel */
];

/** Entra en el primer tercio de su ventana y sale en el ultimo cuarto. */
function ventana(p, de, a) {
  const entra = suave(tramo(p, de, de + (a === null ? 0.04 : (a - de) * 0.32)));
  if (a === null) return entra;
  return entra * (1 - suave(tramo(p, a - (a - de) * 0.26, a)));
}

export function montarActoLlegada() {
  return registrarActo({
    id: 'llegada',
    el: document.getElementById('llegada'),

    preparar(acto) {
      fichas = Array.from(acto.el.querySelectorAll('[data-tramo]'));
      paradas = Array.from(acto.el.querySelectorAll('[data-parada]'));
    },

    pintar(p, acto) {
      /* ---- Fases ------------------------------------------------------- */
      /* 🚨 RITMO. Kiko pidio acelerar «desde que se llega a Japon hasta el
         zoom»: la cadena de encuadres se ha comprimido y lo que gana el hueco
         es el trazado de la ruta, que es la parte que hay que leer. */
      const aJapon = suave(tramo(p, 0.00, 0.09));   /* el globo se amplía */
      const aKanto = suave(tramo(p, 0.13, 0.27));   /* «la zona central de Japón» */
      const aRuta = suave(tramo(p, 0.29, 0.40));    /* y a escala del trayecto */
      const aCerca = suave(tramo(p, 0.46, 0.64));   /* y a escala de los últimos tramos */
      const pNarita = suave(tramo(p, 0.085, 0.135));
      const pCasa = suave(tramo(p, 0.26, 0.33));
      const pTrazo = suave(tramo(p, 0.40, 0.78));
      const pDatos = suave(tramo(p, 0.80, 0.92));


      /* ---- La cámara: cuatro viajes encadenados ------------------------
         🚨 El cuarto no estaba y hacía falta. A la escala del Narita Express,
         la línea Keio mide once píxeles y los tres minutos andando, tres: se
         anunciaban en la ficha dos tramos que no se veían. Ahora la cámara se
         cierra a la vez que la línea llega, y cada tramo se dibuja a una escala
         en la que existe. */
      if (aKanto <= 0) {
        viajarDeVista(V_GLOBO, V_JAPON, aJapon);
      } else if (aRuta <= 0) {
        viajarDeVista(V_JAPON, V_KANTO, aKanto);
      } else if (aCerca <= 0) {
        viajarDeVista(V_KANTO, V_RUTA, aRuta);
      } else {
        viajarDeVista(V_RUTA, V_CERCA, aCerca);
      }

      mostrarLienzo(true);
      alzarLienzo(1);          /* la Tierra ya subio en el acto 1: aqui se queda */

      /* Cuando entran los datos del alojamiento, el mapa se retira casi del
         todo. 🚨 Con un 28 % todavia visible, la linea roja de la ruta cruzaba
         justo por encima de las filas de datos y no se leia ninguna de las dos
         cosas. Se vio en pantalla. */
      opacidadMapa(1 - pDatos * 0.94);
      pintarMapa();

      /* ---- La ruta, pata a pata ---------------------------------------- */
      for (let i = 0; i < PATAS.length; i++) {
        const pata = PATAS[i];
        const avance = tope((pTrazo - pata.desde) / (pata.hasta - pata.desde));
        pintarRuta(i, pata.ruta, avance, { color: pata.def.color, guion: false });
      }
      /* 🚨 La linea de puntos del vuelo la heredamos del acto 1 y se apaga
         mientras el globo se amplia. Antes este acto pisaba esa misma capa con
         el Narita Express y el trazo del vuelo se esfumaba de un fotograma al
         siguiente, justo en la costura. Se vio comparando dos capturas
         consecutivas del empalme. */
      pintarRuta(PATAS.length, RUTA_VUELO, 1, {
        color: 'var(--acento)',
        guion: true,
        /* 🚨 Se va ANTES de que la etiqueta cambie de «Japón» a «Narita», que
           es en 0,085. Kiko: «esto Japón cambia en Narita, deberían
           desvanecerse ya las líneas de puntos del vuelo». Tiene razón: el
           vuelo ya ha terminado, la línea solo estorba. */
        opacidad: 1 - suave(tramo(p, 0.00, 0.075))
      });
      limpiarRutas(PATAS.length + 1);

      /* ---- Los marcadores ----------------------------------------------
         🚨 ESTE ACTO EMPIEZA DONDE ACABA EL 1, exactamente. El acto 1 termina
         con Madrid y «Japón» encendidos, así que aquí arrancan encendidos y se
         van apagando. Antes este acto los apagaba de golpe en su p=0, y como
         en la costura se pintan los dos y el último manda, la etiqueta
         parpadeaba justo al cambiar de acto.

         Y la etiqueta cambia de nombre sin moverse: «Japón» se apaga y
         «Narita» se enciende en el mismo punto, según el mapa se acerca. */
      /* 🚨 APAGA EL DIBUJO DEL ACTO 3. Es EL fallo mas probable de todo el
         acto 3 y por eso esta aqui: al subir el scroll del 3 al 2, este acto no
         sabe nada del tren ni del coche y los dejaba flotando sobre el mapa de
         Tokio. Es la linea de puntos suelta del 16 de septiembre con otro
         nombre, y se arregla igual: un acto apaga lo que no usa. */
      apagarDibujo();

      /* 🚨 Y devuelve el mapa a su tamanio: el acto 3 lo deja encogido para su
         mapa pequenio, y esta capa es de todos (ley 1). */
      empequeñecerMapa(0);

      /* 🚨 Y TODO LO DEMÁS SE APAGA, SIN NOMBRARLO. Antes aquí había una lista
         de `esconder()` escrita a mano, y esa lista tenía que adivinar los
         marcadores de los actos futuros: cuando el acto 5 estrenó Kusatsu, su
         punto se quedaba encendido sobre el globo hasta el vuelo a Madrid.
         Un acto no sabe qué marcadores vendrán; sabe cuáles son suyos. */
      limpiarHitos('madrid', 'japon', 'narita', 'casa', 'shinjuku', 'meidaimae');
      marcar('madrid', LUGARES.madrid, 1 - suave(tramo(p, 0.01, 0.10)));
      marcar('japon', LUGARES.narita, 1 - suave(tramo(p, 0.07, 0.12)));
      marcar('narita', LUGARES.narita, pNarita);
      marcar('casa', LUGARES.alojamientoTokio, pCasa);
      /* 🚨 LA LINEA NO VA A CIEGAS. Cada tramo tiene su destino marcado ANTES
         de empezar a dibujarse, no despues de llegar. Lo pidio Kiko asi: «segun
         vas completando la linea, deberia estar ya marcado el punto hasta donde
         va esa linea, y luego la siguiente». */
      const apaga = 1 - pDatos;
      marcar('shinjuku', LUGARES.shinjuku, suave(tramo(p, 0.32, 0.37)) * apaga);
      marcar('meidaimae', LUGARES.meidaimae, suave(tramo(p, 0.55, 0.60)) * apaga);

      /* El halo se cierra sobre el portal según se recorren los últimos metros */
      const ultima = PATAS[PATAS.length - 1];
      cerrarHalo('casa', tope((pTrazo - ultima.desde) / (ultima.hasta - ultima.desde)));

      /* ---- El texto ---------------------------------------------------- */
      acto.v('--p-japon', aJapon);
      acto.v('--p-kanto', aKanto);
      acto.v('--p-datos', pDatos);

      /* Cada ficha se enciende con su línea y SE APAGA cuando entra la
         siguiente. 🚨 Sin apagarse, las tres acababan superpuestas y el bloque
         de abajo era ilegible: tres titulares y tres pies uno encima de otro.
         Se vio en pantalla. */
      /* 🚨 PRIMERO EL PUNTO, DESPUES LA LINEA. Kiko: «podria salir primero el
         punto, Shinjuku, que ponga abajo primera conexion». Cada parada se
         anuncia antes de que su tramo empiece a dibujarse, y la ficha del tramo
         releva al anuncio. Las ventanas estan en GUION, arriba. */
      for (const e of paradas) e.style.opacity = '0';
      for (const e of fichas) e.style.opacity = '0';

      for (const linea of GUION) {
        const el = (linea.lista === 'parada' ? paradas : fichas)[linea.i];
        if (!el) continue;
        let o = ventana(p, linea.de, linea.a);
        if (linea.a === null) o *= 1 - tramo(pDatos, 0.05, 0.45);  /* la deja el panel */
        el.style.opacity = o.toFixed(3);
      }
    }
  });
}
