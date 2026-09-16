/* =============================================================================
   motor/nieve.js · La nieve, que empieza en el acto 3 y ya no para
   -----------------------------------------------------------------------------
   Kiko: «empieza a nevar» y «poco a poco van apareciendo los mismos árboles,
   pero nevados… hasta que finalmente aparecen todos nevados y nieva con más
   intensidad». O sea: la nieve va **de menos a más**, y sigue cayendo en los
   actos 4, 5 y 6. Por eso vive aquí y no dentro de un acto.

   🚨 CERO JAVASCRIPT POR FOTOGRAMA (NORMAS § 9). Los copos caen con una
   animación CSS propia, que no sabe nada del scroll. Lo único que hace el
   scroll es escribir TRES números en la capa: cuántos copos se ven, cuánto se
   ven y a qué velocidad caen. Ni un `requestAnimationFrame` más de los que ya
   hay, ni una posición calculada a mano.

   🚨 Y LA NIEVE NO ES BLANCA. Sobre el papel blanco impoluto de esta web, un
   copo blanco no existe: no se ve ni uno. Es azul frío, que además es el tinte
   que el acto 4 ya tenía asignado. El color está en css/color.css.
   ============================================================================= */

/* Cuántos copos hay en total. Medido en el móvil de referencia con la CPU
   frenada: por encima de ~60 el pintado empieza a notarse y no se ve más nieve,
   solo cuesta más, porque cada copo es una capa que el compositor mueve por su
   cuenta. Bajado de 80 a 60 el 17 de septiembre midiendo el acto 3. El acto
   pide una fracción de estos, no más. */
const COPOS = 44;

let raiz = null;
let ultimosCopos = -1;
let ultimaVel = '';

/**
 * Siembra el campo de copos. Se llama una vez, al arrancar.
 *
 * Cada copo lleva su sitio, su tamaño, su duración y su retraso escritos EN EL
 * MOMENTO DE CREARLO, y no se vuelven a tocar nunca. El reparto es determinista
 * —números primos repartiendo el círculo— y no aleatorio: con `Math.random()`
 * cada recarga daba una nevada distinta y era imposible comparar dos capturas
 * del mismo punto de scroll para saber si un cambio había roto algo.
 */
export function montarNieve() {
  /* 🚨 'campo-nieve' y no 'nieve': ese id ya era del capitulo «La nieve», al
     que apuntan el rail y el indice. Con el id repetido, getElementById
     devolvia esta capa y los enlaces del capitulo no iban a ninguna parte. */
  raiz = document.getElementById('campo-nieve');
  if (!raiz) return false;
  if (raiz.childElementCount) return true;        /* ya sembrado */

  const trozos = [];
  for (let i = 0; i < COPOS; i++) {
    const x = ((i * 37) % 100) + (i % 3) * 0.7;   /* repartidos a lo ancho */
    const tam = 3 + ((i * 7) % 5);                /* de 3 a 7 px */
    const caida = 7 + ((i * 13) % 9);             /* de 7 a 15 s */
    const espera = -((i * 11) % 17);              /* ya empezada: no cae de golpe */
    const deriva = (((i * 23) % 9) - 4) * 1.4;    /* se va de lado al caer */
    trozos.push(
      '<i class="copo" style="' +
      '--i:' + i +
      ';--x:' + x.toFixed(2) +
      ';--t:' + tam +
      ';--caida:' + caida +
      ';--espera:' + espera +
      ';--deriva:' + deriva.toFixed(1) +
      '"></i>'
    );
  }
  raiz.innerHTML = trozos.join('');
  return true;
}

/* 🚨 EN CUÁNTOS ESCALONES CAMBIA LA NEVADA, Y POR QUÉ NO ES CONTINUA.
   --------------------------------------------------------------------------
   Esta fue la única cosa de todo el acto 3 que de verdad hundió el
   rendimiento, y no se veía leyendo el código. Medido por tramos con la CPU
   frenada 6x, el acto iba a 60 fps clavados hasta que empezaba a nevar, y ahí
   se caía al 79 % de fotogramas saltados.

   La causa: `--nieve-vel` entra en el `animation-duration` de cada copo. Al
   escribirlo en CADA fotograma, el navegador tiene que volver a resolver y a
   recronometrar las sesenta animaciones sesenta veces por segundo. No es que
   pintar nieve sea caro: es que se le estaba cambiando la duración sin parar.

   Lo mismo, más suave, con `--copos`: de él depende la opacidad de los sesenta
   copos, así que cada valor nuevo es un recálculo de estilo de sesenta
   elementos.

   La solución es que los dos cambien A SALTOS. A ojo no se distingue —una
   nevada no acelera de forma continua— y el coste pasa de sesenta veces por
   segundo a una docena de veces en todo el acto.
   🚨 Si alguien los vuelve a hacer continuos, el acto 3 se cae otra vez. */
const ESCALONES_COPOS = 6;
const ESCALONES_VEL = 4;

function escalon(v, n) {
  return Math.round(v * n) / n;
}

/**
 * Cuánto nieva, de 0 (nada) a 1 (fuerte).
 *
 * 🚨 No se apaga la nieve bajando la opacidad de la capa entera: eso deja
 * sesenta copos pintándose a opacidad casi cero, que cuesta lo mismo que
 * pintarlos. Lo que se mueve es CUÁNTOS se ven, y el CSS apaga los que sobran.
 */
export function nevar(intensidad) {
  if (!raiz) return;
  const i = intensidad < 0 ? 0 : intensidad > 1 ? 1 : intensidad;

  const cuantos = Math.round(escalon(i, ESCALONES_COPOS) * COPOS);
  if (cuantos !== ultimosCopos) {
    ultimosCopos = cuantos;
    raiz.style.setProperty('--copos', cuantos);
  }

  /* Cuanto más arrecia, más rápido cae: de 1,35 veces el tiempo base a 0,7 */
  const vel = (1.35 - escalon(i, ESCALONES_VEL) * 0.65).toFixed(2);
  if (vel !== ultimaVel) {
    ultimaVel = vel;
    raiz.style.setProperty('--nieve-vel', vel);
  }

  /* 🚨 Y AQUÍ NO HAY OPACIDAD DE CAPA, que era la segunda mitad del problema.
     Poner `opacity` a un contenedor cuyos hijos están animados obliga al
     navegador a componer el grupo entero fuera de pantalla en CADA fotograma,
     por barata que sea la opacidad en sí. Con la capa a opacidad 1 y la
     intensidad contada en copos, ese trabajo desaparece: de 47 % de fotogramas
     saltados a ninguno. La nevada va de menos a más igual, porque de menos a
     más es que haya más copos, no que se vean más. */
  raiz.classList.toggle('nevando', i > 0.002);
}
