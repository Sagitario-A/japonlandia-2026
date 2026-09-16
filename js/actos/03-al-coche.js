/* =============================================================================
   actos/03-al-coche.js · De un portal de Setagaya a un bosque nevado
   -----------------------------------------------------------------------------
   EL ACTO MÁS LARGO DE LOS OCHO, y el primero con dibujo de caricatura en
   color. Guion literal → web-nueva/DEFINICION.md, acto A3.

   Tres movimientos, y en este orden porque lo confirmó Kiko el 17 de septiembre
   —«la línea se completa hasta Shinjuku y ENTONCES el zoom»—:

     A · EL MAPA SE DESPIDE  vuelve el mapa, se marca Shinjuku, se traza la
                             línea Keio de vuelta, y zoom hasta disolverlo
     B · LA ESTACIÓN         tren · puertas · los cuatro · el tren se va ·
                             mostrador · llave · se van todos menos el coche ·
                             la llave sube, brilla, desbloquea y se consume
     C · LA CARRETERA        el coche anda sin moverse: ciudad, bosque, y
                             empieza a nevar de menos a más

   🚨 DÓNDE EMPIEZA Y DÓNDE ACABA (ley 5 del lienzo). Empieza exactamente donde
   acaba el acto 2: cámara en el encuadre «cerca», mapa al 6 % y el panel del
   alojamiento todavía saliendo de pantalla. Y acaba en el estado en que tendrá
   que empezar el acto 4: coche centrado, bosque nevado y nevando fuerte.

   🚨 LAS POSICIONES VAN EN UNIDADES DEL ESCENARIO, que mide 100u de ancho —de
   -50 a +50— y es el mismo en el móvil y en el portátil. La explicación larga
   está en css/actos/03-al-coche.css § 1.
   ============================================================================= */

import { registrarActo } from '../motor/escenario.js?v=1b7da4d4';
import { tramo, suave, tope } from '../motor/util.js?v=1b7da4d4';
import { encuadrar, viajarDeVista } from '../motor/proyeccion.js?v=1b7da4d4';
import { pintarMapa, pintarRuta, limpiarRutas, marcar, esconder, mostrarLienzo, opacidadMapa, cerrarHalo, alzarLienzo, empequeñecerMapa } from '../motor/lienzo.js?v=1b7da4d4';
import { montarDibujo, mostrarDibujo, colocar, variable, verBanda, desplazarFondo } from '../motor/dibujo.js?v=1b7da4d4';
import { montarNieve, nevar } from '../motor/nieve.js?v=1b7da4d4';
import { tenderRuta } from '../motor/ruta.js?v=1b7da4d4';
import { LUGARES, TRAMO_AL_COCHE, RUTA_NORTE, ENCUADRES } from '../datos/rutas.js?v=1b7da4d4';

function vista(clave) {
  const e = ENCUADRES[clave];
  return [e[0], e[1], encuadrar(e[2])];
}

/* 🚨 Donde acaba la cámara del acto 2 es donde empieza la de este. Si estos dos
   números dejan de cuadrar, se ve un salto en la costura. */
const V_CERCA = vista('cerca');
const V_KEIO = vista('keio');
const V_CALLE = vista('calle');
const V_DISUELVE = vista('disuelve');

const RUTA = tenderRuta(TRAMO_AL_COCHE.pasos, 0.2);

/* 🚨 LA CARRETERA DE VERDAD hasta Takaragawa: el eje de la autopista Kan-Etsu,
   no una línea a ojo. Ver datos/rutas.js y herramientas/generar-carreteras.js */
const RUTA_AL_NORTE = tenderRuta(RUTA_NORTE, 0.2);
const V_NORTE = vista('japonNorte');

/* El mapa pequeño del viaje en coche, en p de este acto */
const MAPA_NORTE = [0.800, 0.858];
const DESTINO_NORTE = [0.818, 0.856];
const CARRETERA = [0.828, 0.968];

/* --------------------------------------------------------------------------
   El reparto del scroll
   --------------------------------------------------------------------------
   Todo el acto sale de esta tabla, y las ventanas SE SOLAPAN a propósito: igual
   que los rótulos del acto 1, una pieza empieza a entrar mientras la anterior
   se está yendo, para que no haya nunca una pantalla con nada.
   -------------------------------------------------------------------------- */
/* 🚨 EL ACTO MIDE 2.400 svh, y ha crecido dos veces por dos motivos distintos.
   De 2.100 a 2.400 fue por el zoom, que necesitaba una tercera parada de cámara
   para que diera tiempo a ver el callejero. Y de 1.300 a 2.100, por esto:
   Con 1.600 la parte de la nieve se comía medio acto en dos pantallas: los
   árboles pasaban de verdes a nevados en seis décimas de pantalla, y el guion
   pide justo lo contrario —«poco a poco van apareciendo los mismos árboles,
   pero nevados… hasta que finalmente aparecen todos nevados y nieva con más
   intensidad»—. La nieve NO es un fundido rápido, es el final del acto.

   El reparto de ahora, en pantallas de las veinte que dura:
     el mapa       6,0    vuelve, traza la Keio hasta Shinjuku y se disuelve
     la estación   8,4    tren, puertas, los cuatro, mostrador, llave, coche
     la carretera  5,6    ciudad, bosque, un rato de bosque, y la nevada */
const F = {
  /* A · el mapa. 🚨 TRES PARADAS DE CÁMARA Y NO DOS: cerca, la línea Keio,
     escala de calle y disolver. La tercera es donde se ve el callejero, y sin
     ella no daba tiempo a verlo. */
  mapaVuelve: [0.035, 0.090],
  shinjuku:   [0.068, 0.100],
  linea:      [0.090, 0.190],
  acercar:    [0.186, 0.268],
  zoom:       [0.268, 0.340],

  /* B · la estación */
  tren:       [0.325, 0.385],
  puertas:    [0.385, 0.415],
  cuatro:     [0.410, 0.450],
  trenSeVa:   [0.450, 0.500],
  mostrador:  [0.496, 0.550],
  llave:      [0.548, 0.585],
  seVan:      [0.582, 0.630],
  centrar:    [0.625, 0.668],
  sube:       [0.666, 0.706],
  luces:      [0.704, 0.728],
  consume:    [0.720, 0.756],

  /* C · la carretera. 🚨 Entre el bosque y la nevada hay un hueco a propósito
     —de 0,850 a 0,870—: es «un rato de bosque» del guion, donde no cambia nada
     salvo que el bosque sigue pasando. Y las dos últimas fases acaban en 0,985
     y no en 1, para que el acto TERMINE con todo nevado y quieto: ese es el
     fotograma del que tiene que arrancar el acto 4. */
  arranca:    [0.752, 0.812],
  bosque:     [0.828, 0.880],
  nieva:      [0.892, 0.985],
  nevado:     [0.912, 0.985]
};

function f(p, fase) {
  return suave(tramo(p, F[fase][0], F[fase][1]));
}

/* --------------------------------------------------------------------------
   Dónde para cada pieza
   --------------------------------------------------------------------------
   En unidades del escenario, comprobado en pantalla a 390 px, que es el ancho
   estrecho: nada de esto se sale por ningún borde, y las tres piezas de la
   escena del mostrador se solapan lo justo para leerse como profundidad —los
   cuatro delante, el coche en medio, el mostrador detrás—, que es el orden en
   que están puestas en el HTML.
   -------------------------------------------------------------------------- */
/* 🚨 LOS CUATRO SE MUEVEN DOS VECES, y la primera se me olvidó.
   Aparecen DELANTE DE LAS PUERTAS —o sea, centrados, porque la puerta del tren
   está centrada— y solo cuando entra el mostrador se apartan a la izquierda
   para dejarle sitio a él y al coche. En el primer montaje salían ya apartados:
   se bajaban del tren por la chapa, tres metros a la izquierda de la puerta por
   la que acababan de salir. Se vio en la captura de las puertas abiertas. */
const X_CUATRO_PUERTA = 0;
const X_CUATRO = -36;      /* apartados, cuando llega el mostrador */
const X_COCHE = -3;        /* «al lado del mostrador», como dice el guion */
const X_MOSTRADOR = 35;    /* a la derecha del todo */

/* 🚨 LA LLAVE VA EN EL HUECO ENTRE EL COCHE Y EL MOSTRADOR, y ese hueco hay que
   dejarlo a propósito. En el primer montaje las piezas eran más grandes, no
   quedaba hueco, y la llave caía justo encima del coche: parecía puesta sobre
   el techo en vez de «entre el recepcionista y nosotros». Se vio en la captura
   del mostrador. Si alguna de las tres piezas engorda, esto se rompe. */
const X_LLAVE = 18;
const Y_LLAVE = -17;

/* 🚨 EL ÚNICO GOLPE DEL ACTO CON TRES PIEZAS EN PANTALLA A LA VEZ.
   Los cuatro, el coche y el mostrador a su tamaño natural suman más de lo que
   mide el escenario, y en un móvil se salían por los dos bordes. Pero medir
   TODAS las piezas para que quepan estas tres deja el resto del acto —el tren
   solo, el coche solo en la carretera— con un dibujo diminuto abajo y media
   pantalla en blanco encima. Eso fue lo primero que se vio en las capturas.

   Así que las piezas son grandes (CSS) y es esta escena la que se encoge. Y el
   coche recupera su tamaño al centrarse bajo la llave, con lo que de paso
   parece que se acerca a nosotros — que es justo lo que pasa. */
const ESCENA_APRETADA = 0.74;

/* Cuántas ranuras tienen las bandas de ciudad y bosque. Es el número más alto
   de los que aparecen en arte/ciudad.svg y arte/bosque.svg, más uno.
   🚨 Si se añade una casa o un árbol con un número más alto, se sube esto. */
const RANURAS = 12;

/* 🚨 EL GUION DEL TEXTO, en ventanas explícitas y no derivado de las fases del
   dibujo. Es la lección del acto 2: derivarlo dejaba huecos sin texto y hacía
   que dos fichas cayeran en la misma celda de la rejilla, una encima de otra. */
const GUION_FICHAS = [
  { i: 0, de: 0.090, a: 0.190 },   /* Línea Keio, de vuelta a Shinjuku */
  { i: 1, de: 0.184, a: 0.285 }    /* Dónde se recoge el coche */
];

const GUION_ROTULOS = [
  /* 🚨 Empieza en 0,43 y no en 0,47: el tren entra en 0,375 y con el rótulo más
     tarde quedaba pantalla y media con el dibujo abajo y NADA arriba. El texto
     entra mientras el tren se está posando. */
  { i: 0, de: 0.370, a: 0.500 },   /* los cuatro */
  /* 🚨 Empalma con el anterior, que se apaga en 0,60: con este empezando en
     0,655 quedaba media pantalla con el mostrador entrando y nada escrito. */
  { i: 1, de: 0.496, a: 0.745 },   /* el coche de alquiler · cubre la llave */
  /* 🚨 Y AQUÍ YA NO HAY UN CUARTO RÓTULO. El de «empieza a nevar» lo quitó
     Kiko el 17 de septiembre: ese sitio de la pantalla lo ocupa ahora el mapa
     pequeño con la carretera hacia Takaragawa, que cuenta lo mismo y además
     dice dónde estamos. */
  { i: 2, de: 0.752, a: 0.818 }    /* hacia el norte · lo releva el mapa */
];

/** Entra en el primer tercio de su ventana y sale en el último cuarto. */
function ventana(p, de, a) {
  const entra = suave(tramo(p, de, de + (a === null ? 0.02 : (a - de) * 0.30)));
  if (a === null) return entra;
  return entra * (1 - suave(tramo(p, a - (a - de) * 0.26, a)));
}

let fichas = [];
let rotulos = [];

/* --------------------------------------------------------------------------
   El texto
   --------------------------------------------------------------------------
   Todo en placeholder, por orden de Kiko: «primero vamos con la estructura de
   la película y todas las animaciones y tal».
   -------------------------------------------------------------------------- */
function pintarTexto(p) {
  for (const e of fichas) e.style.opacity = '0';
  for (const e of rotulos) e.style.opacity = '0';

  for (const linea of GUION_FICHAS) {
    const el = fichas[linea.i];
    if (el) el.style.opacity = ventana(p, linea.de, linea.a).toFixed(3);
  }
  for (const linea of GUION_ROTULOS) {
    const el = rotulos[linea.i];
    if (el) el.style.opacity = ventana(p, linea.de, linea.a).toFixed(3);
  }
}

export function montarActoAlCoche() {
  montarDibujo();
  montarNieve();

  return registrarActo({
    id: 'al-coche',
    el: document.getElementById('al-coche'),

    preparar(acto) {
      fichas = Array.from(acto.el.querySelectorAll('[data-tramo]'));
      rotulos = Array.from(acto.el.querySelectorAll('.rotulo'));
    },

    /* 🚨 AL SALIR, SE RECOGE. Este acto deja dos cosas escritas que nadie más
       apaga. El texto, porque su último rótulo se queda encendido hasta el
       final y la escena de este acto sigue en pantalla mientras el acto 2
       termina: salía «empieza a nevar» impreso sobre el panel del alojamiento.
       Y el dibujo, porque al bajar del acto 3 a los capítulos de texto no hay
       ningún acto detrás que lo apague, y el coche y la nieve se quedaban
       flotando por encima del texto. */
    salir() {
      pintarTexto(-1);
      /* 🚨 Y EL DIBUJO NO SE APAGA AQUÍ. Lo hacía, y Kiko lo vio: «de repente
         desaparece y tarda un rato en llegar lo otro». Bajando del acto a los
         capítulos de texto, el coche se esfumaba de un fotograma al siguiente y
         luego venía una pantalla de nada.
         Ahora el coche se va al fondo y se desvanece según sigues bajando, y de
         eso se encarga principal.js, que es quien sabe cuánto llevas pasado del
         final. Subiendo, lo apaga el acto 2 al pintar (ley 1). */
    },

    pintar(p, acto) {
      /* ================================================================
         A · EL MAPA SE DESPIDE
         ================================================================ */
      const pMapa = f(p, 'mapaVuelve');
      const pLinea = f(p, 'linea');
      const pAcercar = f(p, 'acercar');
      const pZoom = f(p, 'zoom');

      /* 🚨 EL MAPA NO VUELVE HASTA QUE EL PANEL SE HA IDO. El acto 2 termina con
         el panel del alojamiento a pantalla completa y el mapa al 6 %, y por el
         margen negativo de la ley 7 ese panel sigue en pantalla durante la
         primera pantalla de este acto. Si el mapa subiera antes, la línea de la
         Keio cruzaría por encima de las filas de datos — que es exactamente el
         fallo que ya se arregló una vez en el acto 2. */
      const opMapa = (0.06 + 0.94 * pMapa) * (1 - pZoom);

      if (opMapa > 0.004) {
        /* 🚨 LA CÁMARA SE CIERRA MIENTRAS SE DIBUJA LA LÍNEA, y solo entonces
           arranca el zoom que la disuelve. Son dos tramos encadenados y no uno:
           con uno solo, la línea Keio se dibujaba entera a la escala que heredó
           del acto 2 —cincuenta píxeles en una esquina de la pantalla— y el
           zoom empezaba después, sobre un dibujo que no se había podido leer.
           Se vio en la captura, no leyendo el código. */
        if (pAcercar <= 0) {
          viajarDeVista(V_CERCA, V_KEIO, pLinea);
        } else if (pZoom <= 0) {
          /* 🚨 LA TERCERA PARADA. Aquí es donde entra el callejero y donde se
             ve «por dónde vamos». Sin ella, el mapa se disolvía justo cuando
             las calles empezaban a aparecer y no daba tiempo a leer nada. */
          viajarDeVista(V_KEIO, V_CALLE, pAcercar);
        } else {
          viajarDeVista(V_CALLE, V_DISUELVE, pZoom);
        }

        mostrarLienzo(true);
        alzarLienzo(1);
        opacidadMapa(opMapa);
        pintarMapa();

        /* La línea de vuelta a Shinjuku, que es lo último que hace el mapa */
        pintarRuta(0, RUTA, pLinea, { color: TRAMO_AL_COCHE.color, guion: false });
        limpiarRutas(1);

        /* 🚨 LA LÍNEA NO VA A CIEGAS: Shinjuku se enciende ANTES de que salga la
           línea que lleva a él. Lo pidió Kiko el 16 de septiembre y vale para
           todos los actos, no solo para aquel. */
        marcar('shinjuku', LUGARES.shinjuku, f(p, 'shinjuku'));
        /* El portal de donde se sale sigue marcado hasta que arranca el zoom */
        marcar('casa', LUGARES.alojamientoTokio, 1 - pZoom);
        cerrarHalo('casa', 0);
        esconder('madrid');
        esconder('japon');
        esconder('narita');
        esconder('meidaimae');
        esconder('avion');
        empequeñecerMapa(0);
      } else if (p > MAPA_NORTE[0]) {
        /* ================================================================
           EL MAPA PEQUEÑO DEL VIAJE AL NORTE
           ================================================================
           Kiko, el 17 de septiembre: «que aparezca la silueta del mapa de
           Japón, y lo mismo que con las líneas de metro, pero con las
           carreteras hasta el primer punto».

           Es la MISMA capa del mapa, dibujada más pequeña y subida: arriba el
           mapa, abajo el coche cruzando el bosque. No hay un segundo mapa ni
           una segunda cámara, así que la ruta y los marcadores funcionan igual
           que en los actos 1 y 2. */
        const pMini = suave(tramo(p, MAPA_NORTE[0], MAPA_NORTE[1]));
        viajarDeVista(V_NORTE, V_NORTE, 0);
        empequeñecerMapa(pMini);
        mostrarLienzo(true);
        alzarLienzo(1);
        opacidadMapa(pMini * 0.92);
        pintarMapa();

        /* La carretera se dibuja según el coche avanza. 🚨 Y Takaragawa se
           enciende ANTES de que la línea llegue: la línea no va a ciegas. */
        marcar('shinjuku', LUGARES.shinjuku, pMini);
        marcar('takaragawa', LUGARES.takaragawa, suave(tramo(p, DESTINO_NORTE[0], DESTINO_NORTE[1])));
        esconder('casa');
        esconder('madrid');
        esconder('japon');
        esconder('narita');
        esconder('meidaimae');
        esconder('avion');

        const avance = tope((p - CARRETERA[0]) / (CARRETERA[1] - CARRETERA[0]));
        pintarRuta(0, RUTA_AL_NORTE, avance, { color: 'var(--acento)', guion: false });
        cerrarHalo('takaragawa', avance);
        limpiarRutas(1);
      } else {
        /* 🚨 Y CUANDO YA NO SE VE, SE APAGA DE VERDAD. No basta con dejarlo a
           opacidad cero: `pintarMapa()` reproyecta la costa en cada fotograma y
           este acto se pasa media docena de pantallas sin mapa ninguno.
           Apagarlo aquí es media factura de fluidez del acto. */
        mostrarLienzo(false);
        limpiarRutas(0);
        empequeñecerMapa(0);
      }

      /* ================================================================
         B · LA ESTACIÓN
         ================================================================ */
      const pTren = f(p, 'tren');
      const pSeVa = f(p, 'trenSeVa');
      const pCuatro = f(p, 'cuatro');
      const pMostrador = f(p, 'mostrador');
      const pLlave = f(p, 'llave');
      const pSeVan = f(p, 'seVan');
      const pCentrar = f(p, 'centrar');
      const pSube = f(p, 'sube');
      const pConsume = f(p, 'consume');
      const pArranca = f(p, 'arranca');
      const pBosque = f(p, 'bosque');
      const pNieva = f(p, 'nieva');
      const pNevado = f(p, 'nevado');

      const hayDibujo = pTren > 0.001;
      mostrarDibujo(hayDibujo);

      if (!hayDibujo) {
        /* Todavía estamos en el mapa: el dibujo no existe */
        variable('--op-suelo', 0);
        colocar('tren', { op: 0 });
        colocar('cuatro', { op: 0 });
        colocar('mostrador', { op: 0 });
        colocar('coche', { op: 0 });
        colocar('llave', { op: 0 });
        verBanda('ciudad', 0);
        verBanda('bosque', 0);
        verBanda('bosque-nevado', 0);
        nevar(0);
        pintarTexto(p);
        return;
      }

      /* La línea del suelo aparece con el tren y se retira cuando entra la
         banda de ciudad, que trae la suya: dos líneas a la vez se ven como un
         error de impresión. */
      variable('--op-suelo', Math.min(pTren, 1 - pArranca));

      /* --- El tren -----------------------------------------------------
         Entra por la DERECHA y se va por la IZQUIERDA. No es un capricho: el
         mostrador entra por la derecha (lo dice el guion), así que si el tren
         se fuera por ahí se cruzarían en la misma mitad de la pantalla. */
      colocar('tren', {
        x: 150 * (1 - pTren) - 150 * pSeVa,
        y: 0,
        op: Math.min(pTren, 1 - pSeVa * 1.05)
      });

      /* Las puertas: se abren cuando el tren se ha parado y se cierran justo
         antes de que arranque. Atado al scroll, sin animación propia. */
      variable('--puertas', f(p, 'puertas') * (1 - suave(tramo(p, 0.436, 0.458))));

      /* --- Los cuatro --------------------------------------------------
         Aparecen delante de las puertas, se apartan cuando llega el mostrador,
         y 🚨 SE QUEDAN AHÍ MIENTRAS PASA LO DE LA LLAVE. Corrección de Kiko del
         17 de septiembre: «cuando el mostrador desaparece, nosotros quizás
         deberíamos quedarnos ahí al lado, aunque el coche tenga el
         protagonismo». Antes se iban con el mostrador y el coche se quedaba
         solo en una pantalla vacía.

         Se van solo cuando el coche arranca, y entonces la salida por la
         izquierda ya no se lee como irse: se lee como quedarse mientras el
         mundo empieza a correr. Él mismo lo dijo: «el quedarnos ahí puede estar
         fakeado con el irse hacia la izquierda». */
      colocar('cuatro', {
        x: X_CUATRO_PUERTA + (X_CUATRO - X_CUATRO_PUERTA) * pMostrador - 95 * pArranca,
        y: 0,
        op: Math.min(pCuatro, 1 - pArranca * 1.05),
        /* A su tamaño delante del tren —una persona es media altura de vagón— y
           encogidos solo cuando el mostrador y el coche les quitan el sitio */
        escala: 1 - (1 - ESCENA_APRETADA) * pMostrador
      });

      /* --- El mostrador ------------------------------------------------
         «Por la derecha, un mostrador con un coche de alquiler», y se va por la
         derecha: «el mostrador y el dependiente, hacia la derecha». */
      colocar('mostrador', {
        x: X_MOSTRADOR + 72 * (1 - pMostrador) + 82 * pSeVan,
        y: 0,
        op: Math.min(pMostrador, 1 - pSeVan * 1.05),
        escala: ESCENA_APRETADA
      });

      /* --- El coche ----------------------------------------------------
         🚨 EL COCHE NO SE VA CON EL MOSTRADOR. Palabras de Kiko: «el coche que
         estaba al lado del mostrador se queda en la imagen, ese no se
         desplaza». Entra con el mostrador, se queda cuando el mostrador se va,
         y se centra bajo la llave. */
      colocar('coche', {
        x: (X_COCHE + 90 * (1 - pMostrador)) * (1 - pCentrar),
        y: 0,
        op: pMostrador,
        /* Crece al centrarse: entra encogido con el mostrador y se planta */
        escala: ESCENA_APRETADA + (1 - ESCENA_APRETADA) * pCentrar
      });

      /* --- La llave ----------------------------------------------------
         «Una llave entre el recepcionista y nosotros», luego «sube y le empieza
         a salir como un halo de brillar», desbloquea el coche —«al coche se le
         encienden por un momento las luces»— y «se va a menos». */
      /* 🚨 LA LLAVE VA EN DIAGONAL RECTA, desde la mano del dependiente hasta
         encima del coche. Las dos coordenadas con la MISMA fase: en cuanto van
         con fases distintas, el recorrido se parte en dos y se ve una ele.
         Pasó en las dos direcciones —primero subiendo y luego moviéndose, y
         luego al revés— hasta que Kiko lo dijo claro: «como desde donde te la
         dan hacia arriba, como en una diagonal perfecta». */
      colocar('llave', {
        x: X_LLAVE * (1 - pSube),
        y: Y_LLAVE - 24 * pSube,
        op: Math.min(pLlave, 1 - pConsume),
        /* Se consume yendo a menos, no desapareciendo de golpe */
        escala: (ESCENA_APRETADA + (1 - ESCENA_APRETADA) * pSube) * (1 - 0.55 * pConsume)
      });
      variable('--halo', pSube * (1 - pConsume));

      /* El destello del desbloqueo: sube y baja dentro de su ventana. Atado al
         scroll a propósito — si paras de bajar, para. */
      variable('--luces', Math.sin(Math.PI * f(p, 'luces')));

      /* ================================================================
         C · LA CARRETERA · el coche anda sin moverse
         ================================================================
         «En realidad se queda en el centro, pero de repente por la derecha van
         apareciendo edificios de ciudad.» Así que el coche está clavado en x=0
         desde que se centró, y lo que corre es el fondo. */
      const rodado = tope((p - F.arranca[0]) / (1 - F.arranca[0]));
      desplazarFondo(rodado * 1150);

      /* 🚨 DE CIUDAD A BOSQUE, CASA A CASA. Kiko, el 17 de septiembre: «debería
         ser una transición más de dejar de casa árbol, casa árbol, cada vez
         menos casa más árbol, hasta que solo es árbol». Antes era un fundido de
         una banda sobre otra, que es otra cosa.

         Las dos bandas están encendidas a la vez y lo que se mueve es --mezcla:
         cada casa y cada árbol lleva su número de ranura, y el relevo va
         número a número. El reparto está en arte/ciudad.svg y arte/bosque.svg,
         y los números de los dos archivos tienen que casar. */
      const mezcla = pBosque * RANURAS;
      variable('--mezcla', mezcla);

      /* La ciudad se apaga como capa solo cuando ya no le queda ni una casa:
         antes de eso tiene que seguir encendida aunque le falten piezas. */
      verBanda('ciudad', pArranca * (1 - tope((mezcla - (RANURAS - 1)) / 1)));
      verBanda('bosque', pArranca * (1 - pNevado));
      verBanda('bosque-nevado', pNevado);

      /* 🚨 LA NIEVE VA DE MENOS A MÁS. «Empieza a nevar… hasta que finalmente
         aparecen todos nevados y nieva con más intensidad.» Y sigue nevando en
         los actos 4, 5 y 6: por eso la nieve no es de este acto. */
      nevar(pNieva);

      pintarTexto(p);
    }
  });
}
