/* =============================================================================
   motor/ruta.js · Unir dos sitios como se va de verdad
   -----------------------------------------------------------------------------
   Una ruta es una lista de puntos de paso. Entre dos puntos de paso NO se
   dibuja una recta: se dibuja el arco de círculo máximo, que es el camino corto
   sobre una esfera y el que de verdad vuela un avión. En el globo la diferencia
   es enorme —Madrid-Tokio por la recta pasaría por sitios por los que nadie
   pasa—, y a escala de ciudad es invisible, así que vale para las dos cosas.
   ============================================================================= */

import { RAD } from './util.js?v=fd6072d8';
import { aVectores, trazar, proyectar, px, py } from './proyeccion.js?v=fd6072d8';

/**
 * Convierte puntos de paso `[[lon, lat], …]` en una polilínea densa de vectores.
 *
 * `gradosPorTramo` marca cada cuántos grados se mete un punto intermedio: 2° en
 * el globo es suave de sobra, y en trayectos cortos el mínimo de 2 puntos
 * garantiza que siempre haya algo que dibujar.
 */
export function tenderRuta(pasos, gradosPorTramo = 2) {
  const pares = [];

  for (let i = 0; i < pasos.length - 1; i++) {
    const a = pasos[i], b = pasos[i + 1];
    const la = a[0] * RAD, fa = a[1] * RAD, lb = b[0] * RAD, fb = b[1] * RAD;

    const ax = Math.cos(fa) * Math.cos(la), ay = Math.cos(fa) * Math.sin(la), az = Math.sin(fa);
    const bx = Math.cos(fb) * Math.cos(lb), by = Math.cos(fb) * Math.sin(lb), bz = Math.sin(fb);

    /* Ángulo entre los dos extremos: la longitud del arco */
    const d = Math.acos(Math.max(-1, Math.min(1, ax * bx + ay * by + az * bz)));
    const n = Math.max(2, Math.round(d / RAD / gradosPorTramo));

    for (let j = 0; j < n; j++) {
      const t = j / n;
      /* Interpolación esférica. Cuando los dos puntos casi coinciden, el seno
         se va a cero y la fórmula revienta: ahí se interpola recto y se acabó. */
      const s1 = d < 1e-6 ? 1 - t : Math.sin((1 - t) * d) / Math.sin(d);
      const s2 = d < 1e-6 ? t : Math.sin(t * d) / Math.sin(d);
      const x = s1 * ax + s2 * bx, y = s1 * ay + s2 * by, z = s1 * az + s2 * bz;
      pares.push(
        Math.atan2(y, x) / RAD,
        Math.atan2(z, Math.sqrt(x * x + y * y)) / RAD
      );
    }
  }

  const ultimo = pasos[pasos.length - 1];
  pares.push(ultimo[0], ultimo[1]);

  const v = aVectores(pares);
  return { v, puntos: v.length / 3 };
}

/** El trozo de ruta recorrido hasta `avance` (0 → 1). Es lo que hace que la
 *  línea se vaya dibujando sola según bajas. */
export function trazarRuta(ruta, avance) {
  const n = Math.max(2, Math.round(ruta.puntos * avance));
  return trazar(ruta.v, n * 3);
}

/**
 * Dónde está la cabeza de la ruta y hacia dónde apunta, para colocar el avión
 * o el coche encima y girarlo en la dirección de marcha.
 * Devuelve `null` si la cabeza cae en la cara oculta del planeta.
 */
export function cabezaDeRuta(ruta, avance) {
  const n = Math.max(2, Math.round(ruta.puntos * avance));
  const i = (n - 1) * 3, j = (n - 2) * 3;

  if (!proyectar(ruta.v[i], ruta.v[i + 1], ruta.v[i + 2])) return null;
  const x = px, y = py;

  if (!proyectar(ruta.v[j], ruta.v[j + 1], ruta.v[j + 2])) return null;
  const angulo = Math.atan2(y - py, x - px) / RAD;

  return { x, y, angulo };
}
