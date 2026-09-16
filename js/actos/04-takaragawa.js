/* =============================================================================
   actos/04-takaragawa.js · La nieve se amontona y alguien la esquía
   -----------------------------------------------------------------------------
   Guion literal → web-nueva/DEFINICION.md, acto A4. En orden:

     A · LLEGAR       se retira el mapa pequeño que deja puesto el acto 3, el
                      coche sigue rodando bajo la nevada y entran los datos del
                      primer alojamiento de la nieve
     B · LA MONTAÑA   mientras se leen los datos, la nieve que cae se va
                      acumulando abajo hasta ocupar un tercio de la pantalla; el
                      coche se va por la derecha y los datos se retiran
     C · EL ESQUIADOR un monigote la cruza de izquierda a derecha, subiendo y
                      bajando por encima, mientras se cuenta lo del esquí
     D · Y SE QUEDA   la montaña se desliza a la izquierda, el esquiador se
                      centra, y sigue nevando

   🚨 DÓNDE EMPIEZA (ley 5). En el fotograma EXACTO en que acaba el acto 3:
   coche centrado a tamaño natural, bosque nevado con el fondo justo donde lo
   dejó, nevando fuerte, la línea del suelo apagada —la trae la banda— y el mapa
   pequeño de la región todavía puesto al 92 %. Ese último es el relevo que
   anunciaba ESTADO § 5.4: hasta hoy lo retiraba principal.js y a partir de hoy
   lo retira este acto, en su primera pantalla.

   🚨 Y DÓNDE ACABA, que es donde tendrá que empezar el acto 5 —«vuelve el mapa,
   el muñequito sigue ahí esquiando y sigue nevando»—: esquiador centrado sobre
   el suelo, bosque nevado detrás, nevando, sin montaña, sin coche y sin mapa.

   🚨 LAS POSICIONES VAN EN UNIDADES DEL ESCENARIO, que mide 100u de ancho —de
   -50 a +50—. La explicación larga está en css/actos/03-al-coche.css § 1.
   ============================================================================= */

import { registrarActo } from '../motor/escenario.js?v=cfb77c51';
import { tramo, suave, tope, frena } from '../motor/util.js?v=cfb77c51';
import { encuadrar, viajarDeVista } from '../motor/proyeccion.js?v=cfb77c51';
import { pintarMapa, pintarRuta, limpiarRutas, marcar, esconder, mostrarLienzo, opacidadMapa, cerrarHalo, alzarLienzo, empequeñecerMapa } from '../motor/lienzo.js?v=cfb77c51';
import { mostrarDibujo, colocar, variable, verBanda, desplazarFondo, perfilDe, altura } from '../motor/dibujo.js?v=cfb77c51';
import { nevar } from '../motor/nieve.js?v=cfb77c51';
import { tenderRuta } from '../motor/ruta.js?v=cfb77c51';
import { LUGARES, RUTA_NORTE, ENCUADRES } from '../datos/rutas.js?v=cfb77c51';

function vista(clave) {
  const e = ENCUADRES[clave];
  return [e[0], e[1], encuadrar(e[2])];
}

/* Lo que hace falta para repintar el mapa pequeño heredado mientras se va.

   🚨 SÍ, ESTO REPITE EL BLOQUE DEL ACTO 3, y es a propósito. La alternativa
   —no repintar nada y limitarse a bajarle la opacidad a lo que haya en el
   lienzo— parece más limpia y es una trampa: el lienzo es compartido, y
   saltando desde el raíl a este acto después de haber visto el acto 1, lo que
   hay puesto ahí es el globo terráqueo. Se vería la Tierra desvaneciéndose
   durante un tercio de pantalla. Un acto pinta lo suyo desde cero, siempre; es
   la misma razón por la que el acto 2 repite los marcadores con los que acaba
   el 1. */
const RUTA_AL_NORTE = tenderRuta(RUTA_NORTE, 0.2);
const V_NORTE = vista('region');

/* --------------------------------------------------------------------------
   El reparto del scroll
   --------------------------------------------------------------------------
   🚨 EL ACTO MIDE 1.100 svh: diez pantallas de recorrido. NORMAS § 9 lo había
   presupuestado en 800 antes de construirlo, igual que al acto 3 le puso 1.300
   y acabó en 2.400. Con ocho pantallas, la montaña crecía y el monigote la
   cruzaba en pantalla y media entre las dos cosas, y la montaña es LO ÚNICO
   nuevo de todo el acto: merece verse crecer.

   El reparto, en pantallas de las diez que dura:
     llegar       4,5   se va el mapa, el coche rueda y entran los datos
     la montaña   3,2   se acumula la nieve, el coche se va, salen los datos
     el esquí     3,3   el monigote cruza, y el texto del esquí
     se queda     1,5   la montaña se va por la izquierda y él se centra

   (suman más de diez porque las ventanas SE SOLAPAN a propósito: una cosa entra
   mientras la anterior se está yendo, para que no haya nunca una pantalla con
   nada, que es la lección del acto 1)
   -------------------------------------------------------------------------- */
const F = {
  /* A · llegar. 🚨 El mapa se va en la primera tercera parte de pantalla, que
     es exactamente lo que tardaba antes en principal.js: lo que se ve no
     cambia, cambia quién lo hace. */
  mapaSeVa:  [0.000, 0.032],
  /* 🚨 Y NADA DE TEXTO ANTES DE 0,10. La escena del acto 3 se solapa una
     pantalla entera con esta por el margen negativo de la ley 7, así que
     durante la primera pantalla todavía está subiendo por delante con lo suyo.
     Un panel entrando ahí se cruza con ello. */
  datosDent: [0.115, 0.190],
  datosFuer: [0.330, 0.395],

  /* B · la marcha del coche y la montaña.
     🚨 EL COCHE SE VA ANTES DE QUE LA NIEVE CUAJE, y eso se vio en pantalla, no
     leyendo el código: con el coche todavía en el centro y el montón ya por
     encima de las ruedas, no parecía que hubiera nevado, parecía que el coche
     se había quedado enterrado. El orden que cuenta la historia es al revés:
     llegamos, se enseña dónde dormimos, el coche sigue su camino, y ENTONCES
     la nieve se va amontonando donde estaba.

     🚨 Y LA MONTAÑA TERMINA DE CRECER CUANDO LOS DATOS YA SE ESTÁN YENDO. El
     guion pide las dos cosas a la vez —«mientras se muestran, esa nieve se va
     acumulando»— y a la vez se ven, pero el último tercio de la montaña le
     comería el panel por abajo: se cruzan en el sitio donde el panel tiene las
     filas de datos. Así crece durante todo el panel y se planta justo después. */
  cocheSeVa: [0.185, 0.258],
  monte:     [0.230, 0.480],

  /* C · el esquiador cruza, y el texto del esquí */
  esqui:     [0.520, 0.830],

  /* D · la montaña se va y él se queda. 🚨 Acaba en 0,975 y no en 1, para que
     el acto TERMINE quieto: ese fotograma es del que arranca el acto 5. */
  /* 🚨 EMPIEZA ANTES DE QUE ÉL TERMINE DE BAJAR, y a propósito: la montaña se
     va por la izquierda justo cuando le queda el último palmo de ladera, así
     que lo que le deja en el suelo es la propia montaña saliéndose de debajo.
     Con las dos cosas separadas se quedaba plantado a media ladera esperando. */
  monteSeVa: [0.818, 0.972]
};

/* --------------------------------------------------------------------------
   Dónde para cada cosa
   -------------------------------------------------------------------------- */
/* 🚨 LA MONTAÑA MIDE 96u DE ANCHO —lo pone el CSS— así que su ladera llega
   hasta 48u a cada lado del centro. De ahí sale todo lo demás: por dónde entra
   el esquiador, dónde acaba y cuánto hay que desplazarla para que se vaya. */
const MEDIO_MONTE = 48;
const X_ESQ_ENTRA = -62;    /* fuera de pantalla por la izquierda, a ras de suelo */
/* 🚨 38 Y NO 44, Y NO ES REDONDEO. Su dibujo mide 20u de ancho, así que a 44
   se le salía media cabeza por el borde derecho de un móvil, y encima acababa
   metido entre los puntos del raíl. A 38 el dibujo entero cabe con holgura.
   Se queda a media ladera, y lo que le baja el último palmo es la montaña
   yéndose por debajo. */
const X_ESQ_ACABA = 38;
const X_MONTE_FUERA = -152; /* lo que hay que correrla para que no se vea nada */

/* 🚨 UN TERCIO DE LA PANTALLA, Y LA CUENTA VIVE AQUÍ Y EN NINGÚN SITIO MÁS.
   El CSS la lee de --monte-h, que se escribe desde aquí, porque el esquiador
   necesita exactamente el mismo número para saber a qué altura va. Dos
   definiciones de la misma medida —una en CSS y otra en JavaScript— es como el
   monigote acaba flotando un palmo por encima de la nieve.

   Son dos topes y no uno porque la capa del dibujo se mide en vmin y la
   pantalla en svh, y en un móvil alto y en un portátil ancho eso es muy
   distinto: solo con 35 svh, en un portátil la montaña se comía el bosque
   entero; solo con 66u, en un móvil quedaba un montoncito de nada.
   El perfil llega al 94 % de su caja (ver arte/monte.svg), así que 35 svh de
   caja son 33 svh de nieve: el tercio de pantalla que pidió Kiko. */
const PARTE_DE_PANTALLA = 0.35;
const ALTO_MONTE_U = 66;

/* Cuánto fondo pasa mientras el coche sigue rodando.
   🚨 EL NÚMERO ESTÁ ELEGIDO PARA QUE NO SE VEA LA COSTURA. El acto 3 termina
   moviendo el fondo a 2,02 unidades por cada svh de scroll; con `frena` sobre
   0,40 del acto y 1.000 svh de recorrido, arrancar en 400 da 2,00. O sea: el
   bosque cruza el empalme a la MISMA velocidad y va frenando hasta pararse
   cuando el coche se va. Si se toca el largo del acto, se toca esto. */
const RODAJE = 400;
const FONDO_HEREDADO = 1150;   /* donde lo deja el acto 3 */

/* 🚨 EL GUION DEL TEXTO, en ventanas explícitas y no derivadas de las fases del
   dibujo. Es la lección del acto 2: derivarlo dejaba huecos sin texto y hacía
   que dos fichas cayeran en la misma celda, una encima de otra. */
const GUION_ROTULOS = [
  { i: 0, de: 0.545, a: 0.720 },   /* el material se alquila por internet */
  { i: 1, de: 0.705, a: 0.862 }    /* qué pistas, que sigue sin decidir */
];

/** Entra en el primer tercio de su ventana y sale en el último cuarto. */
function ventana(p, de, a) {
  const entra = suave(tramo(p, de, de + (a - de) * 0.30));
  return entra * (1 - suave(tramo(p, a - (a - de) * 0.26, a)));
}

let rotulos = [];

function pintarTexto(p) {
  for (const e of rotulos) e.style.opacity = '0';
  if (p < 0) return;
  for (const linea of GUION_ROTULOS) {
    const el = rotulos[linea.i];
    if (el) el.style.opacity = ventana(p, linea.de, linea.a).toFixed(3);
  }
}

/* 🚨 LO QUE ESTE ACTO NO USA, LO APAGA (ley 1). Y no basta con que el acto 3
   las deje apagadas al terminar: saltando desde el raíl con el acto 3 a medias
   —con el tren puesto, por ejemplo— el último fotograma que se pintó las tenía
   encendidas, y aquí no las tocaría nadie. */
function apagarLoDelActo3() {
  colocar('tren', { op: 0 });
  colocar('cuatro', { op: 0 });
  colocar('mostrador', { op: 0 });
  colocar('llave', { op: 0 });
  variable('--halo', 0);
  variable('--luces', 0);
  variable('--puertas', 0);
  /* La línea del suelo la trae la banda de bosque, igual que al final del acto
     3: dos líneas a la vez se ven como un error de impresión. */
  variable('--op-suelo', 0);
}

export function montarActoTakaragawa() {
  return registrarActo({
    id: 'takaragawa',
    el: document.getElementById('takaragawa'),

    preparar(acto) {
      rotulos = Array.from(acto.el.querySelectorAll('.rotulo'));
    },

    /* 🚨 AL SALIR, SE RECOGE (ley 12). Dos cosas distintas:

       El texto y el panel SIEMPRE, se salga por donde se salga: la escena de
       este acto se solapa una pantalla entera con la del 3 por arriba y con el
       cierre por abajo, y un panel encendido ahí sale impreso encima.

       La montaña y el esquiador SOLO SI SE SALE POR ARRIBA. Son piezas de una
       capa compartida y el acto 3 no sabe que existen, así que volviendo hacia
       atrás se quedarían flotando sobre el bosque — la línea de puntos suelta
       del 16 de septiembre otra vez, con otro nombre. Pero saliendo por abajo
       NO se apagan: ahí el dibujo entero se va cayendo poco a poco
       (principal.js), y cortarlas de golpe es justo lo que Kiko no quería: «de
       repente desaparece y tarda un rato en llegar lo otro».

       🚨 Y POR DÓNDE SE HA SALIDO SE PREGUNTA A LA PÁGINA, NO SE DEDUCE DEL
       ÚLTIMO FOTOGRAMA PINTADO. Aquí había un «si el último p era menor que
       0,5, es que iba hacia arriba», que es verdad bajando a mano y mentira
       saltando: pinchando el raíl, el acto salta de su p 0,60 a fuera de tramo
       sin pintar nada por el camino, así que el último p seguía siendo 0,60 y
       la montaña se quedaba flotando sobre la estación del acto 3. Se vio
       comprobando el ir y volver, no leyendo el código.

       Con la caja de la sección no hay nada que deducir: si su borde de arriba
       está por debajo del borde de la pantalla, es que nos hemos quedado por
       encima del acto. */
    salir(acto) {
      pintarTexto(-1);
      acto.v('--p-datos', 0);
      if (acto.el.getBoundingClientRect().top > 0) {
        colocar('monte', { op: 0 });
        colocar('esquiador', { op: 0 });
      }
    },

    pintar(p, acto) {
      mostrarDibujo(true);

      /* ================================================================
         A · SE RETIRA EL MAPA PEQUEÑO
         ================================================================
         Lo deja puesto el acto 3, al 92 %, con la carretera hasta Takaragawa ya
         completa. Aquí se desvanece sin moverse ni crecer: el paisaje se queda
         entero, que es lo que pidió Kiko el 17 de septiembre —«en el momento en
         que empieza a entrar la sección nueva, quitar el mapa, para que
         solamente se quede el coche con la nieve y el paisaje»—. */
      const opMapa = 0.92 * (1 - suave(tramo(p, F.mapaSeVa[0], F.mapaSeVa[1])));

      if (opMapa > 0.004) {
        viajarDeVista(V_NORTE, V_NORTE, 0);
        empequeñecerMapa(1);
        mostrarLienzo(true);
        alzarLienzo(1);
        opacidadMapa(opMapa);
        pintarMapa();
        marcar('shinjuku', LUGARES.shinjuku, 1);
        marcar('takaragawa', LUGARES.takaragawa, 1);
        esconder('casa');
        esconder('madrid');
        esconder('japon');
        esconder('narita');
        esconder('meidaimae');
        esconder('avion');
        pintarRuta(0, RUTA_AL_NORTE, 1, { color: 'var(--acento)', guion: false });
        cerrarHalo('takaragawa', 1);
        limpiarRutas(1);
      } else {
        /* 🚨 Y AL APAGARLO, DEVOLVERLO A SU TAMAÑO. Apagar el mapa NO deshace el
           encogido: --mini se queda a 1 y la capa sigue medida y subida para el
           mapa pequeño. El acto 5 empieza con «vuelve el mapa», y volvería
           diminuto y pegado al techo. Es la ley 16, y ya pasó una vez entre los
           actos 1 y 2. */
        mostrarLienzo(false);
        limpiarRutas(0);
        empequeñecerMapa(0);
      }

      /* ================================================================
         EL PAISAJE · lo que se hereda del acto 3 y sigue puesto
         ================================================================ */
      apagarLoDelActo3();
      verBanda('ciudad', 0);
      verBanda('bosque', 0);
      verBanda('bosque-nevado', 1);
      /* «Sigue nevando» de principio a fin del acto. Y del 5, y del 6 */
      nevar(1);

      /* El coche sigue rodando sin moverse, y el bosque va frenando hasta
         pararse: hemos llegado. Ver RODAJE, arriba. */
      desplazarFondo(FONDO_HEREDADO + RODAJE * frena(tramo(p, 0, 0.40)));

      /* --- El coche se va por la derecha --------------------------------
         El guion dice «el coche continúa hacia la derecha», y en algún momento
         tiene que irse: el acto 6 dice «aparece OTRA VEZ el mismo coche». Se va
         cuando terminan los datos, que es cuando ya hemos llegado. Confirmado
         por Kiko el 17 de septiembre, antes de construir el acto.
         Al cuadrado, para que parezca que acelera al arrancar. */
      const pCocheSeVa = suave(tramo(p, F.cocheSeVa[0], F.cocheSeVa[1]));
      colocar('coche', {
        x: 118 * pCocheSeVa * pCocheSeVa,
        y: 0,
        op: 1 - tope((pCocheSeVa - 0.9) / 0.1),
        escala: 1
      });

      /* ================================================================
         B · LA MONTAÑA QUE SE ACUMULA
         ================================================================
         «Esa nieve que va cayendo se va acumulando abajo y va haciendo una
         especie de montañita de nieve que ocupa hasta un tercio de la
         pantalla.»

         🚨 CRECE CON UNA `transform`, NO APILANDO COPOS. Apilar de verdad es
         contar partículas y rehacer un trazado en cada fotograma: la ley 15 en
         su forma más cara. Aquí el dibujo está quieto y lo único que se mueve
         son dos números que el navegador compone sin repintar nada.

         Se ensancha a la vez que sube, y con la raíz: un montón de nieve se
         extiende deprisa al principio y después ya casi solo gana altura. Solo
         a lo alto parecía una sábana inflándose. */
      const pMonte = suave(tramo(p, F.monte[0], F.monte[1]));
      const pIrse = suave(tramo(p, F.monteSeVa[0], F.monteSeVa[1]));
      const anchoRel = 0.45 + 0.55 * Math.sqrt(pMonte);
      const xMonte = X_MONTE_FUERA * pIrse;

      colocar('monte', {
        x: xMonte,
        op: pMonte > 0.004 ? 1 : 0,
        escala: pMonte,
        escalaX: anchoRel
      });

      /* La altura de la montaña en píxeles, de donde cuelga todo lo demás. Se
         escribe en la capa para que el CSS la use tal cual.
         💭 `innerHeight` y `svh` no son exactamente lo mismo en un móvil con la
         barra del navegador a medio esconder, pero da igual: el CSS lee ESTE
         número, así que los dos van siempre de acuerdo. */
      const altoPantalla = window.innerHeight;
      const unidad = Math.min(window.innerWidth, altoPantalla) / 100;   /* 1u en px */
      const altoMonte = Math.min(altoPantalla * PARTE_DE_PANTALLA, unidad * ALTO_MONTE_U);
      variable('--monte-h', altoMonte.toFixed(1) + 'px');

      /* ================================================================
         C · EL ESQUIADOR
         ================================================================
         «Desde la izquierda hacia la derecha, subiendo y luego bajando por
         encima de la montaña, aparece un monigote chiquitito que la esquía.»

         🚨 SUBE POR LA MONTAÑA DE VERDAD, no por una curva parecida. La tabla
         de alturas la mide motor/dibujo.js del propio trazado de arte/monte.svg
         en cuanto llega el archivo, así que retocar el dibujo mueve al monigote
         con él. Si todavía no ha llegado, `altura()` devuelve 0 y el esquiador
         va por el suelo: un hueco, nunca un error. */
      const tCruce = tramo(p, F.esqui[0], F.esqui[1]);
      const anchoMonte = MEDIO_MONTE * anchoRel;
      const xEsq = (X_ESQ_ENTRA + (X_ESQ_ACABA - X_ESQ_ENTRA) * tCruce) * (1 - pIrse);

      const tabla = perfilDe('monte');
      /* Dónde cae el esquiador sobre la caja de la montaña, de 0 a 1. Va
         referido a DÓNDE ESTÁ LA MONTAÑA y no al centro de la pantalla: cuando
         al final se desliza hacia la izquierda, esto se sale de su borde por sí
         solo, `altura()` devuelve 0 y el monigote se queda en el suelo sin una
         línea de código que lo diga. */
      const sobreMonte = (xEsq - xMonte) / (2 * anchoMonte) + 0.5;
      const altoAqui = altura(tabla, sobreMonte) * pMonte;

      /* La pendiente, para que vaya inclinado: sin esto no esquía, resbala.
         Se mide en píxeles de verdad —la montaña es mucho más ancha que alta, y
         mezclar unidades daría un ángulo inventado— y a los dos lados del punto
         donde está, que es la pendiente de debajo de los esquís. */
      const paso = 0.02;
      const sube = (altura(tabla, sobreMonte + paso) - altura(tabla, sobreMonte - paso)) * pMonte * altoMonte;
      const avanza = 2 * paso * (2 * anchoMonte) * unidad;
      const pendiente = avanza > 0.01 ? -Math.atan2(sube, avanza) * 180 / Math.PI : 0;
      /* 🚨 NO SE LE DA LA PENDIENTE ENTERA, Y SE VIO EN PANTALLA. En la parte
         empinada de la ladera el ángulo pasa de 45°, y con el monigote girado
         eso entero no parecía esquiando: parecía caído de espaldas con los
         esquís por el aire. Con dos tercios se lee como que se inclina en la
         subida y se echa adelante en la bajada, que es lo que hace un esquiador
         de verdad — que tampoco va perpendicular a la nieve. Se bajó dos veces
         mirando la pantalla: con 0,62 y tope de 34° la bajada seguía pareciendo
         una caída de cabeza. */
      const giro = Math.max(-24, Math.min(24, pendiente * 0.45));

      colocar('esquiador', {
        x: xEsq,
        y: -altoAqui,
        op: p >= F.esqui[0] ? 1 : 0,
        escala: 1,
        giro: giro
      });

      /* ================================================================
         EL TEXTO
         ================================================================
         Todo en placeholder menos lo que Kiko ya cerró: que el material de
         esquí se alquila por internet, lo mandan a Tokio y se devuelve en
         Matsumoto. Las pistas siguen sin decidir y así se dice. */
      pintarTexto(p);
      acto.v('--p-datos',
        suave(tramo(p, F.datosDent[0], F.datosDent[1])) *
        (1 - suave(tramo(p, F.datosFuer[0], F.datosFuer[1]))));
    }
  });
}
