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

import { registrarActo } from '../motor/escenario.js';
import { tramo, suave, tope } from '../motor/util.js';
import { mirarA } from '../motor/proyeccion.js';
import { pintarMapa, pintarRuta, pintarVehiculo, marcar, esconder, mostrarLienzo, opacidadMapa } from '../motor/lienzo.js';
import { tenderRuta } from '../motor/ruta.js';
import { VUELO_IDA, LUGARES } from '../datos/rutas.js';

/* La ruta real de Iberia, tendida una vez al cargar */
const RUTA = tenderRuta(VUELO_IDA);

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
      const pVuelo = suave(tramo(p, 0.20, 0.92));
      const pPista = 1 - suave(tramo(p, 0.00, 0.08));

      /* ---- La cámara --------------------------------------------------- */
      mirarA(LON_0 + (LON_1 - LON_0) * pVuelo, LAT_0 + (LAT_1 - LAT_0) * pVuelo, 100);

      mostrarLienzo(true);
      opacidadMapa(pEntrada);
      pintarMapa();

      /* ---- La ruta y el avión ------------------------------------------ */
      pintarRuta(0, RUTA, pVuelo, { color: 'var(--acento)', guion: true });
      pintarVehiculo('avion', RUTA, pVuelo);

      /* Los extremos, con sus etiquetas. Entran cuando el título se va, para
         no pisarlo: se vio en pantalla que competían. */
      const opHitos = 1 - pTitulo;
      marcar('madrid', LUGARES.madrid, opHitos);
      marcar('narita', LUGARES.narita, opHitos * suave(tramo(p, 0.45, 0.70)));
      esconder('casa');

      /* ---- El texto ---------------------------------------------------- */
      acto.v('--p-entrada', pEntrada);
      acto.v('--p-titulo', pTitulo);
      acto.v('--p-pista', pPista);

      for (let i = 0; i < rotulos.length; i++) {
        rotulos[i].style.opacity = opacidadRotulo(p, i, rotulos.length, 0.22, 0.94).toFixed(3);
      }
    }
  });
}
