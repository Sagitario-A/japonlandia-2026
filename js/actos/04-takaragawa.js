/* =============================================================================
   actos/04-takaragawa.js · La nieve se amontona y alguien la baja en tabla
   -----------------------------------------------------------------------------
   Guion literal → web-nueva/DEFINICION.md, acto A4. En orden:

     A · LLEGAR       se retira el mapa pequeño que deja puesto el acto 3, el
                      coche sigue rodando bajo la nevada y los datos del primer
                      alojamiento de la nieve SUBEN DESDE ABAJO hasta ponerse
                      por delante del paisaje y del coche
     B · LA MONTAÑA   el coche se va por la derecha, los datos se desvanecen
                      quietos, y entonces la nieve que cae se va acumulando
                      ABAJO DEL TODO DE LA PÁGINA hasta hacer un montón ancho
     C · EL MONIGOTE  lo cruza EN TABLA de izquierda a derecha, subiendo y
                      bajando por encima, mientras se cuenta lo de la nieve
     D · Y SE QUEDA   la montaña se desliza a la izquierda, el monigote se
                      centra, y sigue nevando

   🔁 TRES COSAS LAS CAMBIÓ KIKO EL 18 DE SEPTIEMBRE, viendo el acto publicado:
   el muñeco baja en tabla y no con esquís; el panel de datos sube desde abajo
   del todo y se pone por delante del paisaje en vez de apartarse a la parte de
   arriba; y la montaña se amontona en el borde de abajo de la página, «no en el
   suelo del paisaje». De ahí sale el orden de A y B: el guion original ponía la
   nieve acumulándose MIENTRAS se leen los datos, y él lo puso en fila —«cuando
   ya se haya ido el coche, [el panel] se desvanezca del todo y siga nevando y
   la montaña de nieve aparezca abajo del todo»—. Además de ser lo que pidió, es
   lo único que funciona: el panel sube desde abajo y la montaña crece desde
   abajo, así que a la vez se pelearían por el mismo sitio de la pantalla.

   🚨 DÓNDE EMPIEZA (ley 5). En el fotograma EXACTO en que acaba el acto 3:
   coche centrado a tamaño natural, bosque nevado con el fondo justo donde lo
   dejó, nevando fuerte, la línea del suelo apagada —la trae la banda— y el mapa
   pequeño de la región todavía puesto al 92 %. Ese último es el relevo que
   anunciaba ESTADO § 5.4: hasta hoy lo retiraba principal.js y a partir de hoy
   lo retira este acto, en su primera pantalla.

   🚨 Y DÓNDE ACABA, que es donde tendrá que empezar el acto 5 —«vuelve el mapa,
   el muñequito sigue ahí esquiando y sigue nevando»—: monigote centrado abajo
   del todo, bosque nevado detrás y por encima, nevando, sin montaña, sin coche
   y sin mapa.

   🚨 LAS POSICIONES VAN EN UNIDADES DEL ESCENARIO, que mide 100u de ancho —de
   -50 a +50—. La explicación larga está en css/actos/03-al-coche.css § 1.
   ============================================================================= */

import { registrarActo } from '../motor/escenario.js?v=ee16f646';
import { tramo, suave, tope, frena } from '../motor/util.js?v=ee16f646';
import { encuadrar, viajarDeVista } from '../motor/proyeccion.js?v=ee16f646';
import { pintarMapa, pintarRuta, limpiarRutas, marcar, esconder, mostrarLienzo, opacidadMapa, cerrarHalo, alzarLienzo, empequeñecerMapa } from '../motor/lienzo.js?v=ee16f646';
import { mostrarDibujo, colocar, variable, variableDe, verBanda, desplazarFondo, perfilDe, altura, bajarSuelo } from '../motor/dibujo.js?v=ee16f646';
import { nevar, nieveHastaElSuelo } from '../motor/nieve.js?v=ee16f646';
import { tenderRuta } from '../motor/ruta.js?v=ee16f646';
import { LUGARES, RUTA_NORTE, ENCUADRES } from '../datos/rutas.js?v=ee16f646';

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
     la bajada    3,0   el monigote cruza en tabla, y el texto de la nieve
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

  /* 🚨 EL PANEL SUBE DESDE ABAJO DEL TODO, y por eso son dos ventanas y no una.
     datosSube es el viaje y solo va hacia delante; datosDent y datosFuer son lo
     que se ve. Al final se desvanece QUIETO, que es lo que pidió Kiko —«se
     desvanezca del todo»—: con una sola ventana, al apagarse se habría ido
     otra vez hacia abajo por donde vino.

     🚨 Y NADA DE TEXTO ANTES DE 0,10. La escena del acto 3 se solapa una
     pantalla entera con esta por el margen negativo de la ley 7, así que
     durante la primera pantalla todavía está subiendo por delante con lo suyo.
     Un panel entrando ahí se cruza con ello. */
  datosSube: [0.100, 0.205],
  datosDent: [0.100, 0.175],
  datosFuer: [0.300, 0.380],

  /* B · la marcha del coche y la montaña.
     🚨 PRIMERO SE VA EL COCHE Y DESPUÉS CUAJA LA NIEVE, y esto vale por dos
     motivos. Lo pidió Kiko así, y además ya se había visto en pantalla antes de
     que lo dijera: con el coche todavía en el centro y el montón ya por encima
     de las ruedas, no parecía que hubiera nevado, parecía que el coche se había
     quedado enterrado. */
  cocheSeVa: [0.265, 0.340],

  /* 🚨 Y AQUÍ BAJA EL PAISAJE ENTERO. Kiko, el 18 de septiembre: «cuando el
     coche se va, lo que podemos hacer, según seguimos scrolleando, es bajar el
     paisaje abajo del todo, que el suelo coincida con la parte de abajo… y ahí
     ya sí tiene sentido que la montaña esté también en la parte de abajo».

     Es la pieza que faltaba. Antes había DOS suelos —el del bosque a media
     pantalla y el borde inferior donde se amontonaba la nieve— con una franja
     de blanco en medio que no era de nadie. Ahora es uno solo que baja: el
     bosque, su carretera y el recorte de la nieve se deslizan hasta el canto de
     abajo, y la montaña crece sobre esa misma línea.
     Empieza en cuanto el coche ya no está y el fondo ha dejado de correr. */
  bajaPaisaje: [0.360, 0.480],
  monte:     [0.480, 0.645],

  /* C · el monigote cruza en tabla, y el texto de la nieve */
  esqui:     [0.620, 0.890],

  /* D · la montaña se va y él se queda. 🚨 Acaba en 0,972 y no en 1, para que
     el acto TERMINE quieto: ese fotograma es del que arranca el acto 5.
     🚨 Y EMPIEZA ANTES DE QUE ÉL TERMINE DE BAJAR, a propósito: la montaña se
     va por la izquierda justo cuando le queda el último palmo de ladera, así
     que lo que le deja en el suelo es la propia montaña saliéndose de debajo.
     Con las dos cosas separadas se quedaba plantado a media ladera esperando. */
  monteSeVa: [0.875, 0.975]
};

/* --------------------------------------------------------------------------
   Dónde para cada cosa
   -------------------------------------------------------------------------- */
/* 🚨 LA MONTAÑA MIDE 132u DE ANCHO —lo pone el CSS— así que su ladera llega
   hasta 66u a cada lado del centro, o sea que en un móvil, que mide 100u, las
   dos faldas se salen bastante por los lados: se ve un TROZO de montaña, que es
   lo que hace que parezca grande. De aquí sale todo lo demás: por dónde entra
   el monigote, dónde acaba y cuánto hay que correrla para que se vaya.
   🚨 Y por eso el monigote aparece por el borde izquierdo ya subiendo un poco,
   no a ras de suelo: a ras de suelo estaría a 66u, o sea fuera de la pantalla.
   Se lee bien —viene de más allá— y es lo que permite que la montaña sea más
   ancha que la pantalla. */
const MEDIO_MONTE = 66;
const X_ESQ_ENTRA = -80;    /* fuera de pantalla, por la falda de la izquierda */
/* 🚨 40 Y NO 60, QUE ES DONDE ACABA LA MONTAÑA. Su dibujo mide 20u de ancho,
   así que a 60 se le saldría entero por el borde derecho de un móvil. A 40 cabe
   justo, y se queda a media ladera: lo que le baja el último palmo es la
   montaña yéndose por debajo. */
const X_ESQ_ACABA = 40;
const X_MONTE_FUERA = -200; /* lo que hay que correrla para que no se vea nada */

/* 🚨 UN TERCIO DE LA PANTALLA, Y LA CUENTA VIVE AQUÍ Y EN NINGÚN SITIO MÁS.
   El CSS la lee de --monte-h, que se escribe desde aquí, porque el monigote
   necesita exactamente el mismo número para saber a qué altura va. Dos
   definiciones de la misma medida —una en CSS y otra en JavaScript— es como el
   monigote acaba flotando un palmo por encima de la nieve.

   Son dos topes y no uno porque la capa del dibujo se mide en vmin y la
   pantalla en svh, y en un móvil alto y en un portátil ancho eso es muy
   distinto: solo con 30 svh, en un portátil la montaña se comía el bosque
   entero; solo con 60u, en un móvil quedaba un montoncito de nada.

   🔁 Y la montaña se apoya en el BORDE DE ABAJO DE LA PÁGINA, no en el suelo
   del paisaje (lo pidió Kiko el 18 de septiembre), así que estos mismos números
   la dejan mucho más baja en el encuadre que antes: su cima queda por debajo de
   la carretera del bosque en vez de por encima de las copas.

   🚨 Y EL PERFIL SOLO LLEGA AL 83 % DE SU CAJA, no al 94 % de la primera
   versión, porque la cima pasó a ser una cúpula ancha en vez de un pico (ver
   arte/monte.svg). O sea que 30 svh de caja son 25 svh de nieve: si alguien
   vuelve a hacer la cima puntiaguda, la montaña crece sola sin tocar esto. */
const PARTE_DE_PANTALLA = 0.30;
const ALTO_MONTE_U = 60;

/* Cuánto fondo pasa mientras el coche sigue rodando.
   🚨 EL NÚMERO ESTÁ ELEGIDO PARA QUE NO SE VEA LA COSTURA. El acto 3 termina
   moviendo el fondo a 2,02 unidades por cada svh de scroll; con `frena` sobre
   0,36 del acto y 1.000 svh de recorrido, arrancar en 363 da 2,02. O sea: el
   bosque cruza el empalme a la MISMA velocidad y va frenando hasta pararse
   cuando el coche se va. Si se toca el largo del acto, se toca esto. */
const RODAJE = 363;
const RUEDA_HASTA = 0.36;
const FONDO_HEREDADO = 1150;   /* donde lo deja el acto 3 */

/* 🚨 EL GUION DEL TEXTO, en ventanas explícitas y no derivadas de las fases del
   dibujo. Es la lección del acto 2: derivarlo dejaba huecos sin texto y hacía
   que dos fichas cayeran en la misma celda, una encima de otra. */
const GUION_ROTULOS = [
  { i: 0, de: 0.645, a: 0.800 },   /* el material se alquila por internet */
  { i: 1, de: 0.785, a: 0.925 }    /* dónde se baja, que sigue sin decidir */
];

/** Entra en el primer tercio de su ventana y sale en el último cuarto. */
function ventana(p, de, a) {
  const entra = suave(tramo(p, de, de + (a - de) * 0.30));
  return entra * (1 - suave(tramo(p, a - (a - de) * 0.26, a)));
}

let rotulos = [];
let sueloRel = 0.68;   /* se lee de --suelo al preparar el acto */

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
      /* 🚨 DÓNDE ESTÁ LA LÍNEA DEL SUELO, leída UNA vez de donde vive, que es
         base.css. Hace falta en píxeles para bajar el paisaje con `transform`
         en vez de moviendo `top`, y escribir aquí un 68 % a mano sería una
         segunda copia de un número que ya tiene dueño. getComputedStyle es
         caro: por eso se hace al preparar y no en cada fotograma. */
      const capa = document.getElementById('dibujo');
      const leido = capa ? parseFloat(getComputedStyle(capa).getPropertyValue('--suelo')) : NaN;
      sueloRel = isNaN(leido) ? 0.68 : leido / 100;
    },

    /* 🚨 AL SALIR, SE RECOGE (ley 12). Dos cosas distintas:

       El texto y el panel SIEMPRE, se salga por donde se salga: la escena de
       este acto se solapa una pantalla entera con la del 3 por arriba y con el
       cierre por abajo, y un panel encendido ahí sale impreso encima.

       La montaña y el monigote SOLO SI SE SALE POR ARRIBA. Son piezas de una
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
      acto.v('--p-sube', 0);
      if (acto.el.getBoundingClientRect().top > 0) {
        colocar('monte', { op: 0 });
        colocar('monigote', { op: 0 });
        colocar('tabla', { op: 0 });
        /* 🚨 Y EL SUELO VUELVE ARRIBA. El acto 3 no sabe que esta variable
           existe, así que volviendo hacia atrás se quedaría con el bosque
           pegado al canto de abajo y el coche con él. Es la ley 16. */
        bajarSuelo(0);
        nieveHastaElSuelo(0);
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
      /* 🚨 EL PAISAJE BAJA HASTA EL BORDE DE ABAJO cuando el coche ya se ha ido.
         Se escribe SIEMPRE, también cuando vale 0: es una variable de una capa
         compartida, y saltando desde el raíl a media montaña sin pasar por aquí
         el bosque se quedaría a media pantalla con la nieve amontonada debajo,
         flotando. Lo barato es escribir un número; lo caro es el fallo. */
      const baja = suave(tramo(p, F.bajaPaisaje[0], F.bajaPaisaje[1]));
      /* 🚨 EL RECORTE DE LA NIEVE BAJA A SALTOS, y es la ley 15 otra vez.
         --baja-paisaje mueve el `clip-path` de la capa de nieve, y recortar en
         cada fotograma un grupo con cuarenta y cuatro hijos animados obliga al
         navegador a componerlo entero cada vez: medido, el acto pasaba del 0 %
         de fotogramas saltados al 7 %. En ocho escalones no se nota —lo único
         que marca ese borde es dónde desaparece un copo, y para entonces está
         detrás del bosque que está bajando— y son ocho escrituras en toda la
         bajada en vez de setenta. El desplazamiento de verdad, --baja-px, sí va
         continuo: eso es `transform` y no cuesta nada. */
      nieveHastaElSuelo(Math.round(baja * 8) / 8);
      /* La misma bajada en píxeles, que es lo que suman a su `transform` las
         bandas, la línea del suelo y las piezas. Ver 03-al-coche.css. */
      bajarSuelo(baja * window.innerHeight * (1 - sueloRel));
      verBanda('ciudad', 0);
      verBanda('bosque', 0);
      verBanda('bosque-nevado', 1);
      /* «Sigue nevando» de principio a fin del acto. Y del 5, y del 6 */
      nevar(1);

      /* El coche sigue rodando sin moverse, y el bosque va frenando hasta
         pararse: hemos llegado. Ver RODAJE, arriba. */
      desplazarFondo(FONDO_HEREDADO + RODAJE * frena(tramo(p, 0, RUEDA_HASTA)));

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
         🔁 Y desde el 18 de septiembre la baja EN TABLA, por orden de Kiko: «el
         muñeco, en vez de esquí, que haga snowboard». Solo cambia el dibujo —
         arte/monigote.svg—; lo que hace aquí es exactamente lo mismo.

         🚨 SUBE POR LA MONTAÑA DE VERDAD, no por una curva parecida. La tabla
         de alturas la mide motor/dibujo.js del propio trazado de arte/monte.svg
         en cuanto llega el archivo, así que retocar el dibujo mueve al monigote
         con él. Si todavía no ha llegado, `altura()` devuelve 0 y el monigote
         va por el suelo: un hueco, nunca un error. */
      const tCruce = tramo(p, F.esqui[0], F.esqui[1]);
      const anchoMonte = MEDIO_MONTE * anchoRel;
      const xEsq = (X_ESQ_ENTRA + (X_ESQ_ACABA - X_ESQ_ENTRA) * tCruce) * (1 - pIrse);

      const tabla = perfilDe('monte');
      /* Dónde cae el monigote sobre la caja de la montaña, de 0 a 1. Va
         referido a DÓNDE ESTÁ LA MONTAÑA y no al centro de la pantalla: cuando
         al final se desliza hacia la izquierda, esto se sale de su borde por sí
         solo, `altura()` devuelve 0 y el monigote se queda en el suelo sin una
         línea de código que lo diga. */
      const sobreMonte = (xEsq - xMonte) / (2 * anchoMonte) + 0.5;
      const altoAqui = altura(tabla, sobreMonte) * pMonte * altoMonte;

      /* La pendiente, para que vaya inclinado: sin esto no baja, resbala.
         Se mide en píxeles de verdad —la montaña es mucho más ancha que alta, y
         mezclar unidades daría un ángulo inventado— y a los dos lados del punto
         donde está, que es la pendiente de debajo de la tabla. */
      const paso = 0.02;
      const sube = (altura(tabla, sobreMonte + paso) - altura(tabla, sobreMonte - paso)) * pMonte * altoMonte;
      const avanza = 2 * paso * (2 * anchoMonte) * unidad;
      const pendiente = avanza > 0.01 ? -Math.atan2(sube, avanza) * 180 / Math.PI : 0;
      /* 🚨 NO SE LE DA LA PENDIENTE ENTERA, Y SE VIO EN PANTALLA. En la parte
         empinada de la ladera el ángulo pasa de 45°, y con el monigote girado
         eso entero no parecía bajando: parecía caído de espaldas con la tabla
         por el aire. Con menos de la mitad se lee como que se inclina en la
         subida y se echa adelante en la bajada, que es lo que hace quien baja
         de verdad — que tampoco va perpendicular a la nieve. Se bajó dos veces
         mirando la pantalla: con 0,62 y tope de 34° la bajada seguía pareciendo
         una caída de cabeza. */
      const giro = Math.max(-24, Math.min(24, pendiente * 0.45));

      /* 🚨 Y DÓNDE ACABA DE PIE: en el suelo, sin hacer nada. Aquí hubo un
         apaño —devolverlo a mano a la altura del bosque— que dejó de hacer
         falta en cuanto Kiko dijo de bajar el paisaje entero: el suelo baja
         hasta donde está la montaña, así que cuando ella se desliza y el perfil
         se sale de debajo, él se queda de pie sobre la misma línea en la que se
         apoya el bosque. Una idea suya que se llevó por delante diez líneas
         mías, que es la mejor clase de idea. */
      /* 🚨 Y LA POSTURA, QUE ES UNA VARIABLE Y SE OLVIDA IGUAL QUE UNA PIEZA.
         Desde el acto 5 el muñeco tiene dos: en tabla y relajado en el onsen.
         El acto 5 la cambia, y esta capa es compartida, así que volviendo hacia
         atrás bajaría la montaña sentado en una bañera que ya no está. Es la
         ley 16 aplicada a algo que no es una pieza. Cuesta una comparación por
         fotograma y no se escribe si no ha cambiado. */
      variableDe('monigote', '--pose', 0);

      colocar('monigote', {
        x: xEsq,
        y: -altoAqui,
        op: p >= F.esqui[0] ? 1 : 0,
        escala: 1,
        giro: giro
      });

      /* 🚨 Y LA TABLA, QUE DESDE EL ACTO 5 ES UNA PIEZA APARTE.
         Vivía dentro del dibujo del muñeco hasta que Kiko describió el acto 5
         —«se cae de la tabla y sube hacia arriba en diagonal»—: a partir de ahí
         cada uno va por su lado, y dos cosas que se mueven por separado no
         pueden ser el mismo dibujo. Aquí van pegadas, y para eso comparten
         `viewBox` y tamaño: con la misma x, la misma y y el mismo giro encajan
         exactas. Lo que se ve en este acto no cambió ni un píxel. */
      colocar('tabla', {
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
      /* 🚨 DOS VARIABLES PARA EL PANEL, Y NO UNA. --p-sube es el viaje desde el
         borde de abajo de la pantalla y SOLO VA HACIA DELANTE: llega a 1 y se
         queda. --p-datos es lo que se ve. Así, al final se desvanece quieto en
         su sitio, que es lo que pidió Kiko —«se desvanezca del todo»—, en vez
         de irse otra vez hacia abajo por donde vino. */
      acto.v('--p-sube', suave(tramo(p, F.datosSube[0], F.datosSube[1])));
      acto.v('--p-datos',
        suave(tramo(p, F.datosDent[0], F.datosDent[1])) *
        (1 - suave(tramo(p, F.datosFuer[0], F.datosFuer[1]))));
    }
  });
}
