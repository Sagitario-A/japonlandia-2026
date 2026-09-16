/* =============================================================================
   principal.js · La entrada
   -----------------------------------------------------------------------------
   Monta el escenario, registra los actos y arranca el único bucle que hay.
   Todo lo que este archivo hace es coser: la lógica vive en motor/ y actos/.
   ============================================================================= */

import { registrarGlobal, arrancar } from './motor/escenario.js?v=a17f41b7';
import { montarLienzo, mostrarLienzo, desvanecerMapa } from './motor/lienzo.js?v=a17f41b7';
import { desvanecerDibujo } from './motor/dibujo.js?v=a17f41b7';
import { nevar } from './motor/nieve.js?v=a17f41b7';
/* 🚨 `tope` lo usa el desvanecido del final, ahi abajo. Lo quite una vez al
   limpiar codigo muerto y el final de la pelicula dejo de ejecutarse entero,
   sin que saltara ninguna comprobacion: ver el aviso de capturas-web.js. */
import { tope } from './motor/util.js?v=a17f41b7';
import { montarActoVuelo } from './actos/01-vuelo.js?v=a17f41b7';
import { montarActoLlegada } from './actos/02-llegada.js?v=a17f41b7';
import { montarActoAlCoche } from './actos/03-al-coche.js?v=a17f41b7';
import { montarActoTakaragawa } from './actos/04-takaragawa.js?v=a17f41b7';
import { montarActoKusatsu } from './actos/05-kusatsu.js?v=a17f41b7';
import { montarActoYamanouchi } from './actos/06-yamanouchi.js?v=a17f41b7';

/* --------------------------------------------------------------------------
   1 · El escenario y los actos
   -------------------------------------------------------------------------- */
montarLienzo();
montarActoVuelo();
montarActoLlegada();
montarActoAlCoche();
montarActoTakaragawa();
montarActoKusatsu();
montarActoYamanouchi();

/* --------------------------------------------------------------------------
   2 · La barra de arriba y el raíl
   --------------------------------------------------------------------------
   Durante la portada estorban las dos cosas: aparecen cuando el título ya se ha
   ido. Como dependen del scroll absoluto y no de ningún acto, van aquí.
   -------------------------------------------------------------------------- */
const barra = document.getElementById('barra');
const rail = document.getElementById('rail');
/* 🚨 EL FIN DE LA PELICULA ES EL ULTIMO ACTO QUE EXISTA, y hay que moverlo
   cada vez que se anade uno. Con esto apuntando a 'llegada' y el acto 3 detras,
   el escenario se apagaba A MITAD DEL ACTO 3: los globales corren DESPUES de
   los actos, asi que ganan, y el mapa se iba justo mientras se trazaba la linea
   Keio hacia Shinjuku. */
const finPelicula = document.getElementById('yamanouchi');

registrarGlobal(function (scroll, alto, sinMovimiento) {
  const pasadaLaPortada = sinMovimiento || scroll > alto * 0.9;
  if (barra) {
    barra.classList.toggle('visible', pasadaLaPortada);
    barra.classList.toggle('posada', scroll > 8);
  }
  if (rail) rail.classList.toggle('visible', pasadaLaPortada);

  /* 🚨 CÓMO SE ACABA LA PELÍCULA.
     A partir de aquí la página son capítulos de texto, y una capa fija por
     encima solo molesta. Pero apagarla de golpe se ve: Kiko lo dijo viendo el
     acto 3, «de repente desaparece y tarda un rato en llegar lo otro».

     Así que el dibujo se va cayendo al fondo durante la pantalla siguiente al
     final del último acto, y con él la nevada. El mapa, que a esas alturas ya
     está apagado, se retira cuando la sección sale de pantalla.

     La cuenta: mientras el acto corre, su sección llega por debajo del borde
     inferior, así que `alto - bottom` es negativo y esto vale 0. Justo en el
     último fotograma del acto, bottom vale `alto` y sigue valiendo 0. De ahí en
     adelante bottom baja hasta 0 y esto sube hasta 1: exactamente una pantalla
     de desvanecido. */
  if (finPelicula) {
    const caja = finPelicula.getBoundingClientRect();
    /* 🚨 EL MAPA Y EL DIBUJO NO SE VAN A LA VEZ, y el orden importa.

       Kiko, el 17 de septiembre, corrigiéndose a sí mismo: «el coche no tiene
       que desaparecer, ni la nieve, ni la carretera, hasta que ya haya entrado
       bastante la otra sección… pero en el momento en que empieza a entrar la
       sección nueva, quitar el mapa, para que solamente se quede el coche con
       la nieve y el paisaje».

       O sea: el mapa de Japón ha contado lo suyo y estorba en cuanto llega el
       alojamiento, así que se va enseguida. El coche, la nieve y el bosque son
       el sitio donde estamos, y se quedan hasta que el capítulo ya está puesto.

       🚨 Y DESDE EL 17 DE SEPTIEMBRE EL MAPA YA NO SE VA AQUÍ. El relevo lo
       hace el acto 4, que hereda el mapa pequeño puesto y lo retira en su
       primera pantalla —ver js/actos/04-takaragawa.js—. Esta línea se queda
       porque sigue haciendo falta: es la que apaga cualquier resto de mapa al
       acabar la película, y es gratis cuando no hay nada que apagar.
       Lo que de verdad importa de aquí es el DIBUJO: el coche, el monigote y
       la nieve se van cayendo al fondo durante el cierre, y por eso el cierre
       mide una pantalla entera. */
    const fin = tope((alto - caja.bottom) / alto);
    desvanecerMapa(tope(fin / 0.25));
    desvanecerDibujo(tope((fin - 0.45) / 0.55));
    /* La nieve se va con él. Y además se va PORQUE se va: sesenta copos
       animados dentro de una capa a la que se le está bajando la opacidad
       obligan al navegador a componer el grupo aparte en cada fotograma
       (ley 15). Menos copos, menos factura. */
    if (fin > 0) nevar(1 - tope((fin - 0.45) / 0.55));
    if (caja.bottom < 0) mostrarLienzo(false);
  }
});

/* --------------------------------------------------------------------------
   3 · El raíl marca por qué acto vas
   --------------------------------------------------------------------------
   🚨 AQUÍ HABÍA MUCHO MÁS, y se fue con los capítulos de texto.

   Hasta el 17 de septiembre, detrás de los actos había cuatro capítulos
   escritos —la nieve, Kioto, Año Nuevo y la vuelta— esperando a que les llegara
   su acto, y esta sección los hacía aparecer al entrar, dibujaba la pagoda de
   Kioto midiendo sus trazos y los metía en el raíl. Kiko los quitó: «que borre
   las secciones que están después de donde estamos y se limite a nuestro plan».

   Lo que queda es lo único que sigue haciendo falta: marcar en el raíl por qué
   acto vas. Cuando un acto nuevo aparezca en el HTML, entra aquí solo.
   -------------------------------------------------------------------------- */
if ('IntersectionObserver' in window) {
  const enlacesRail = Array.from(document.querySelectorAll('.rail a'));
  const vigiaRail = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      for (const a of enlacesRail) {
        a.setAttribute('aria-current', a.dataset.rail === e.target.id ? 'true' : 'false');
      }
    }
  }, { rootMargin: '-45% 0px -45% 0px' });
  for (const acto of document.querySelectorAll('.acto')) vigiaRail.observe(acto);
}

/* --------------------------------------------------------------------------
   4 · En marcha
   -------------------------------------------------------------------------- */
arrancar();
