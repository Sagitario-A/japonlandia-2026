/* =============================================================================
   actos/01-vuelo.js · Catorce horas y diez minutos
   -----------------------------------------------------------------------------
   La Tierra sube desde abajo por detrás del título, gira hacia Japón y el avión
   va dejando la línea de puntos. Los datos del vuelo **aparecen y se difuminan
   sobre el globo** encadenados, en vez de vivir en una sección aparte: lo pidió
   Kiko así el 16 de septiembre, y por eso este acto es tres veces más largo que
   la intro que sustituye — hacía falta scroll para que quepan.

   Guion → web-nueva/DEFINICION.md, acto A1.
   ============================================================================= */

import { registrarActo } from '../motor/escenario.js?v=24e7ec13';
import { tramo, suave, tope } from '../motor/util.js?v=24e7ec13';
import { mirarA } from '../motor/proyeccion.js?v=24e7ec13';
import { pintarMapa, pintarRuta, limpiarRutas, pintarVehiculo, marcar, esconder, mostrarLienzo, opacidadMapa, alzarLienzo } from '../motor/lienzo.js?v=24e7ec13';
import { tenderRuta } from '../motor/ruta.js?v=24e7ec13';
import { VUELO_IDA, LUGARES } from '../datos/rutas.js?v=24e7ec13';

/* La ruta real de Iberia, tendida una vez al cargar.
   Se exporta porque el acto 2 la hereda: si desaparece de golpe al cambiar de
   acto se ve el corte, asi que alli se desvanece mientras empieza el zoom. */
export const RUTA_VUELO = tenderRuta(VUELO_IDA);
const RUTA = RUTA_VUELO;

/* 🚨 Dónde acaba la cámara de este acto es donde empieza la del siguiente.
   Si estos dos números no cuadran con los del acto 2, se ve un salto. */
export const VISTA_FINAL = [128, 38, 100];

const LON_0 = -14, LAT_0 = 22;
const LON_1 = VISTA_FINAL[0], LAT_1 = VISTA_FINAL[1];

let rotulos = [];

/**
 * Los rótulos se encadenan: cada uno entra, se queda un rato y se va, y el
 * siguiente empieza cuando el anterior se está yendo. El solape es a propósito,
 * para que nunca haya un hueco en blanco sobre el globo.
 */
function opacidadRotulo(p, i, total, desde, hasta) {
  const largo = (hasta - desde) / total;
  const ini = desde + i * largo;
  const entra = tramo(p, ini, ini + largo * 0.22);
  const sale = 1 - tramo(p, ini + largo * 0.78, ini + largo);
  return suave(Math.min(entra, sale));
}

export function montarActoVuelo() {
  return registrarActo({
    id: 'vuelo',
    el: document.getElementById('vuelo'),

    preparar(acto) {
      rotulos = Array.from(acto.el.querySelectorAll('.rotulo'));
    },

    pintar(p, acto) {
      /* ---- Fases ------------------------------------------------------- */
      const pEntrada = suave(tramo(p, 0.00, 0.16));   /* la Tierra subiendo */
      const pTitulo = 1 - suave(tramo(p, 0.05, 0.20));
      /* 🚨 Hasta 0,985 y no hasta 0,92. Con el vuelo acabando en 0,92 quedaba
         un 8 % de este acto —media pantalla de scroll— en el que el avion ya
         habia llegado y no pasaba nada, justo antes de que el acto 2 empezara
         a ampliar. Kiko lo noto como una espera larga entre llegar a Japon y
         el zoom, y no era el zoom: era esta cola muerta. */
      const pVuelo = suave(tramo(p, 0.20, 0.985));
      const pPista = 1 - suave(tramo(p, 0.00, 0.08));

      /* ---- La cámara --------------------------------------------------- */
      mirarA(LON_0 + (LON_1 - LON_0) * pVuelo, LAT_0 + (LAT_1 - LAT_0) * pVuelo, 100);

      mostrarLienzo(true);
      opacidadMapa(pEntrada);
      alzarLienzo(pEntrada);          /* la Tierra sube, no solo aparece */
      pintarMapa();

      /* ---- La ruta y el avión ------------------------------------------ */
      pintarRuta(0, RUTA, pVuelo, { color: 'var(--acento)', guion: true });
      pintarVehiculo('avion', RUTA, pVuelo);

      /* 🚨 Y SE BORRA LO QUE PINTÓ EL ACTO 2. Al subir el scroll de vuelta, las
         capas del Narita Express y de la línea Keio se quedaban con el `d` del
         último fotograma del acto 2 —una geometría calculada con OTRA cámara— y
         reaparecían sobre el globo como una línea de puntos suelta y mal
         puesta. Kiko lo vio haciendo scroll hacia atrás.
         Un acto no solo pinta lo suyo: apaga lo que no es suyo. */
      limpiarRutas(1);

      /* ---- Los marcadores ----------------------------------------------
         🚨 Aquí el destino se llama JAPÓN, no Narita. A escala de globo lo que
         se reconoce es el país; el aeropuerto no significa nada hasta que el
         mapa se acerca. Lo pidió Kiko el 16 de septiembre: «cuando se va
         girando la tierra, en vez de poner Japón, pone Narita — y debería ser
         Japón, y ya cuando se empieza a hacer grande, Narita».

         Y se apaga TODO lo que este acto no usa. Lo que un acto no toca se
         queda como estuviera, y Shinjuku y Meidaimae salían encendidas sobre
         el globo durante el vuelo entero. */
      const opHitos = 1 - pTitulo;
      marcar('madrid', LUGARES.madrid, opHitos);
      marcar('japon', LUGARES.narita, opHitos * suave(tramo(p, 0.45, 0.70)));
      esconder('narita');
      esconder('casa');
      esconder('shinjuku');
      esconder('meidaimae');

      /* ---- El texto ---------------------------------------------------- */
      acto.v('--p-entrada', pEntrada);
      acto.v('--p-titulo', pTitulo);
      acto.v('--p-pista', pPista);

      for (let i = 0; i < rotulos.length; i++) {
        rotulos[i].style.opacity = opacidadRotulo(p, i, rotulos.length, 0.22, 0.97).toFixed(3);
      }
    }
  });
}
