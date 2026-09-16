/* =============================================================================
   motor/util.js · Las cuatro cuentas que usa todo lo demás
   -----------------------------------------------------------------------------
   Nada de esto sabe nada del viaje ni de la pantalla. Son las curvas con las
   que un número de 0 a 1 se convierte en movimiento.
   ============================================================================= */

export const RAD = Math.PI / 180;

/** Deja un número entre 0 y 1. */
export function tope(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * El trozo de `v` que cae entre `a` y `b`, reescalado a 0-1.
 * Es lo que reparte el progreso de un acto en fases:
 *   tramo(p, 0.30, 0.80) vale 0 hasta 0,30, sube hasta 1 en 0,80 y ahí se queda.
 */
export function tramo(v, a, b) {
  return tope((v - a) / (b - a));
}

/** Arranque y frenada suaves (smoothstep). Sin esto todo se mueve como un robot. */
export function suave(t) {
  return t * t * (3 - 2 * t);
}

/** Frenada sola: entra rápido y se posa. Para lo que llega a su sitio. */
export function frena(t) {
  return 1 - (1 - t) * (1 - t);
}

/** Interpolación lineal. */
export function mezcla(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Interpolación de una escala.
 * 🚨 El zoom NO se interpola linealmente. Ir de R=100 a R=19.000 en línea recta
 * se pasa el 90 % del recorrido pegado al final: se siente como un tirón y una
 * parada. En logarítmico, cada fotograma multiplica por el mismo factor, que es
 * como se mueve una cámara de verdad.
 */
export function mezclaEscala(a, b, t) {
  return a * Math.pow(b / a, t);
}

/** Redondeo rápido a un decimal, para no llenar los `path` de basura.
 *  `toFixed` es sorprendentemente caro cuando se llama 7.000 veces por
 *  fotograma; esto hace lo mismo con una multiplicación y una división. */
export function r1(v) {
  return Math.round(v * 10) / 10;
}
