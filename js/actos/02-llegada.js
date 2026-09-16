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

import { registrarActo } from '../motor/escenario.js?v=c94af970';
import { tramo, suave, tope } from '../motor/util.js?v=c94af970';
import { encuadrar, viajarDeVista } from '../motor/proyeccion.js?v=c94af970';
import { pintarMapa, pintarRuta, limpiarRutas, marcar, esconder, mostrarLienzo, opacidadMapa, cerrarHalo, alzarLienzo } from '../motor/lienzo.js?v=c94af970';
import { tenderRuta } from '../motor/ruta.js?v=c94af970';
import { LUGARES, TRAMOS_LLEGADA, ENCUADRES } from '../datos/rutas.js?v=c94af970';
import { VISTA_FINAL, RUTA_VUELO } from './01-vuelo.js?v=c94af970';

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

export function montarActoLlegada() {
  return registrarActo({
    id: 'llegada',
    el: document.getElementById('llegada'),

    preparar(acto) {
      fichas = Array.from(acto.el.querySelectorAll('[data-tramo]'));
    },

    pintar(p, acto) {
      /* ---- Fases ------------------------------------------------------- */
      /* 🚨 RITMO. Kiko pidio acelerar «desde que se llega a Japon hasta el
         zoom»: la cadena de encuadres se ha comprimido y lo que gana el hueco
         es el trazado de la ruta, que es la parte que hay que leer. */
      const aJapon = suave(tramo(p, 0.00, 0.13));   /* el globo se amplía */
      const aKanto = suave(tramo(p, 0.15, 0.28));   /* «la zona central de Japón» */
      const aRuta = suave(tramo(p, 0.30, 0.42));    /* y a escala del trayecto */
      const aCerca = suave(tramo(p, 0.48, 0.66));   /* y a escala de los últimos tramos */
      const pNarita = suave(tramo(p, 0.12, 0.18));
      const pCasa = suave(tramo(p, 0.28, 0.36));
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
        opacidad: 1 - suave(tramo(p, 0.02, 0.22))
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
      esconder('avion');
      marcar('madrid', LUGARES.madrid, 1 - suave(tramo(p, 0.01, 0.10)));
      marcar('japon', LUGARES.narita, 1 - suave(tramo(p, 0.07, 0.12)));
      marcar('narita', LUGARES.narita, pNarita);
      marcar('casa', LUGARES.alojamientoTokio, pCasa);
      /* 🚨 LA LINEA NO VA A CIEGAS. Cada tramo tiene su destino marcado ANTES
         de empezar a dibujarse, no despues de llegar. Lo pidio Kiko asi: «segun
         vas completando la linea, deberia estar ya marcado el punto hasta donde
         va esa linea, y luego la siguiente». */
      const apaga = 1 - pDatos;
      marcar('shinjuku', LUGARES.shinjuku, suave(tramo(pTrazo, 0.00, 0.05)) * apaga);
      marcar('meidaimae', LUGARES.meidaimae, suave(tramo(pTrazo, 0.58, 0.66)) * apaga);

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
      for (let i = 0; i < fichas.length; i++) {
        const pata = PATAS[i];
        if (!pata) continue;
        const largo = pata.hasta - pata.desde;
        const entra = suave(tramo(pTrazo, pata.desde, pata.desde + largo * 0.25));
        const esUltima = i === PATAS.length - 1;
        const sale = esUltima
          ? tramo(pDatos, 0.05, 0.45)                                   /* la deja el panel */
          : suave(tramo(pTrazo, pata.hasta - largo * 0.18, pata.hasta));
        fichas[i].style.opacity = (entra * (1 - sale)).toFixed(3);
      }
    }
  });
}
