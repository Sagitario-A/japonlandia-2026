/* =============================================================================
   actos/05-kusatsu.js · La roca, el vuelo y el onsen
   -----------------------------------------------------------------------------
   Guion literal → web-nueva/DEFINICION.md, acto A5. En orden:

     A · EL MAPA      vuelve el mapa pequeño de la región, «el muñequito sigue
                      ahí esquiando y sigue nevando», y se completa la ruta en
                      coche del primer sitio al segundo
     B · LA ROCA      «va apareciendo una roca chiquitita por la derecha» y se
                      planta A LA DERECHA DEL MEDIO
     C · EL GOLPE     ÉL cruza el medio hasta ella, se choca, SE CAE DE LA
                      TABLA y sale por el aire en diagonal recta HASTA EL MEDIO,
                      donde le espera el onsen; la tabla se va dando vueltas por
                      el otro lado y cae a la nieve
     D · EL ONSEN     mientras él cae, el onsen SUBE DESDE DEBAJO DEL BORDE DE
                      ABAJO, se pasa de largo y rebota hasta posarse
     E · DENTRO       atraviesa el agua, desaparece, y vuelve a salir hasta
                      media espalda, relajado
     F · LOS DATOS    y ahí se queda mientras se muestran los del segundo
                      alojamiento

   🚨 LO DE «POR DEBAJO» LO RESOLVIÓ KIKO, Y ERA EL ÚNICO NUDO DEL ACTO.
   El guion dice que el onsen «aparece por debajo» mientras el muñeco cae, y el
   acto 4 deja el suelo pegado al borde de abajo de la pantalla: ahí no hay
   debajo. Se le enseñaron tres salidas —subir el paisaje entero, apoyar el
   onsen en la línea del suelo, o subirlo solo un poco— y dio una cuarta, que es
   mejor que las tres: «justo antes de llegar a tocar el suelo, aparece el onsen
   como por abajo, de esto que sube y rebota hacia abajo y baja un pelín como
   para darles efecto de animación». O sea que «por debajo» es POR DEBAJO DEL
   BORDE DE LA PANTALLA, y el paisaje no se mueve ni un píxel. Ver ESTADO § 5.5.

   🚨 DÓNDE EMPIEZA (ley 5). En el fotograma EXACTO en que acaba el acto 4:
   monigote centrado y de pie en su tabla, bosque nevado detrás y por encima,
   nevando fuerte, sin montaña, sin coche y sin mapa —y el mapa devuelto a su
   tamaño—. Y sobre todo: EL PAISAJE BAJADO, con el suelo en el borde de abajo
   de la pantalla. Eso NO se hereda solo: --baja-px y --baja-paisaje son de una
   capa compartida y el acto 3 las devuelve a cero en cuanto pinta, así que este
   acto tiene que volver a escribirlas en CADA fotograma suyo.

   🚨 Y DÓNDE ACABA, que es donde empezará el acto 6 —«el muñeco sigue ahí y
   vuelve el mapa con la ruta hasta el tercer sitio»—: el muñeco metido en el
   onsen y relajado, la roca en el medio, la tabla tumbada en la nieve a la
   izquierda, bosque nevado detrás, nevando, sin mapa y sin datos.

   🚨 LAS POSICIONES VAN EN UNIDADES DEL ESCENARIO, que mide 100u de ancho —de
   -50 a +50—. La explicación larga está en css/actos/03-al-coche.css § 1.
   La excepción es la `y` del muñeco y de la tabla, que va EN PÍXELES: se la
   quedaron así del acto 4, donde la altura se la daba el perfil medido de la
   montaña, que ya venía en píxeles.
   ============================================================================= */

import { registrarActo } from '../motor/escenario.js?v=47c92712';
import { tramo, suave, tope, frena, mezcla } from '../motor/util.js?v=47c92712';
import { encuadrar, viajarDeVista } from '../motor/proyeccion.js?v=47c92712';
import { pintarMapa, pintarRuta, limpiarRutas, marcar, mostrarLienzo, opacidadMapa, cerrarHalo, alzarLienzo, empequeñecerMapa, limpiarHitos } from '../motor/lienzo.js?v=47c92712';
import { mostrarDibujo, colocar, variable, verBanda, desplazarFondo, bajarSuelo, limpiarPiezas, postura, zoomEscena } from '../motor/dibujo.js?v=47c92712';
import { nevar, nieveHastaElSuelo } from '../motor/nieve.js?v=47c92712';
import { tenderRuta } from '../motor/ruta.js?v=47c92712';
import { LUGARES, RUTA_A_KUSATSU, ENCUADRES } from '../datos/rutas.js?v=47c92712';

function vista(clave) {
  const e = ENCUADRES[clave];
  return [e[0], e[1], encuadrar(e[2])];
}

/* La ruta de Takaragawa a Kusatsu, tendida una sola vez al cargar. Es la
   carretera de verdad —88 km por Minakami, Tsukiyono, la 145 del valle y
   Naganohara—, sacada de OpenStreetMap: ver datos/carretera-kusatsu.js. */
const RUTA = tenderRuta(RUTA_A_KUSATSU, 0.2);
/* 🚨 SU PROPIO ENCUADRE, Y NO EL DE LA REGIÓN. ESTADO § 5.5 daba por hecho que
   el del acto 3 servía tal cual —Kusatsu cae dentro—, y en pantalla no servía:
   el tramo es la quinta parte del viaje desde Tokio, así que salía un rasguño
   en una esquina y la etiqueta de Kusatsu se cortaba contra el borde. Es lo
   mismo que Kiko corrigió en el acto 3 y se vio igual: mirando. */
const V_NORTE = vista('kusatsu');

/* --------------------------------------------------------------------------
   El reparto del scroll
   --------------------------------------------------------------------------
   🚨 EL ACTO MIDE 1.000 svh: nueve pantallas. NORMAS § 9 le había presupuestado
   700 antes de construirlo, y la historia de los dos actos anteriores es que el
   presupuesto siempre se queda corto: el 3 pasó de 1.300 a 2.400 y el 4 de 800
   a 1.100. Kiko: «prefiero que cada golpe respire a que el acto sea corto».

   El reparto, en pantallas de las nueve que dura:
     el mapa y la ruta   4,0   vuelve el mapa, se dibuja la carretera, él rueda
     la roca             1,4   entra por la derecha y se para en el medio
     el golpe            1,3   se choca, se cae de la tabla y vuela
     el onsen            1,0   sube rebotando, él cae dentro y sale relajado
     los datos           2,8   el panel del segundo alojamiento

   (suman más de nueve porque las ventanas SE SOLAPAN a propósito: una cosa
   entra mientras la anterior se está yendo)
   -------------------------------------------------------------------------- */
const F = {
  /* A · el mapa y la ruta.
     🚨 EL MAPA ENTRA YA EN SU SITIO, solo por opacidad, que es lo que pidió
     Kiko en la tercera ronda del acto 3: «que se empiece a aparecer ya
     directamente en la posición en la que está, para que no venga debajo de los
     árboles ni del coche». */
  mapaEntra: [0.015, 0.080],
  ruta:      [0.085, 0.300],
  mapaSeVa:  [0.330, 0.400],
  /* Lo que dura el tramo, debajo del mapa. Entra con la ruta y se va con ella */
  viajeDent: [0.115, 0.190],
  viajeFuer: [0.330, 0.400],

  /* B · la roca. 🚨 NO TIENE VENTANA PROPIA: va colgada del mismo movimiento
     del mundo que el bosque, ver MUNDO_ROCA. Si tuviera la suya, la roca y los
     árboles se moverían a velocidades distintas y la roca parecería que anda
     sola. Llega al medio exactamente cuando el paisaje se para. */
  rueda:     [0.000, 0.440],

  /* C · el golpe. «Se cae de la tabla y sube hacia arriba en diagonal, como
     hacia la llave, ese movimiento más o menos.» La llave del acto 3 subía en
     diagonal perfecta —las dos coordenadas con la misma fase— porque Kiko lo
     pidió dos veces; aquí es la misma cuenta, y él volvió a nombrar la llave al
     corregir el acto: «vaya desde donde choca con la roca hasta el medio». */
  /* 🔁 MÁS ANCHA DESDE LA PRIMERA RONDA DE KIKO: antes recorría nueve unidades
     y ahora treinta y seis, porque la roca se para a la derecha y es él quien
     cruza el medio. Con la ventana de antes no era una travesía, era un
     teletransporte. */
  /* 🚨 ACABA EXACTAMENTE DONDE EMPIEZA `vuelo`, Y NO UN PELO DESPUÉS. La
     trayectoria por el aire manda en cuanto empieza su ventana, así que con la
     embestida terminando más tarde el muñeco despegaba SIN HABER LLEGADO a la
     roca: se quedaba a cinco unidades y salía volando de un golpe que no había
     dado. Se vio en la captura de 'justo antes del golpe'. */
  embiste:   [0.435, 0.505],
  vuelo:     [0.505, 0.570],
  caida:     [0.570, 0.634],
  tablaVuela:[0.505, 0.600],

  /* D · el onsen sube desde debajo del borde de abajo y rebota.
     🚨 TERMINA ANTES QUE LA CAÍDA, y por eso empieza en mitad del vuelo: «justo
     antes de llegar a tocar el suelo, aparece el onsen». Si llega después, el
     muñeco cae sobre la nieve y el onsen le sale por debajo, que es otra cosa. */
  onsenSube: [0.545, 0.628],

  /* E · dentro. Desaparece al cruzar el agua y vuelve a salir relajado */
  tragado:   [0.625, 0.642],
  emerge:    [0.658, 0.716],

  /* F · los datos. Se desvanecen QUIETOS al final, como en el acto 4, para que
     el acto termine en el fotograma del que arranca el 6 */
  datosSube: [0.706, 0.800],
  datosDent: [0.706, 0.780],
  datosFuer: [0.930, 0.980]
};

/* --------------------------------------------------------------------------
   Dónde para cada cosa
   -------------------------------------------------------------------------- */
/* Por dónde entra la roca: fuera de la pantalla por la derecha —la pantalla
   mide 100u, o sea de -50 a +50— y se para en el medio, que es lo que dice el
   guion. */
const X_ROCA_ENTRA = 78;
/* 🚨 CUÁNTO LLEVA RECORRIDO EL MUNDO CUANDO ASOMA LA ROCA. La roca va colgada
   de la MISMA curva que mueve el bosque, así que las dos cosas comparten
   velocidad y frenada: al 55 % del recorrido del paisaje la roca entra por el
   borde, y las dos se paran a la vez. Es más barato y más creíble que darle una
   ventana propia con su propia curva. */
const MUNDO_ROCA = 0.70;

/* 🚨 DÓNDE SE PARA LA ROCA: A LA DERECHA DEL MEDIO, NO EN EL MEDIO.
   🔁 Lo corrigió Kiko viendo el acto publicado: «en vez de quedarse fija en el
   medio, que se quede fija como un poco más a la derecha y que sea el muñeco el
   que atraviesa más del medio, es decir, el que se mueve hacia la roca que ya
   está estática».

   Y no es un ajuste de gusto: cambia QUIÉN hace la acción. Con la roca en el
   centro, el que llegaba era el decorado y el muñeco solo esperaba a que le
   diera. Ahora la roca se planta y es ÉL quien cruza la pantalla hasta ella,
   que es lo que hace que el golpe sea suyo.
   25 unidades: lo justo para que quede claramente a la derecha y siga cabiendo
   entera en un móvil, que mide 100u de ancho. */
export const X_ROCA_PARA = 25;

/* Él va derivando hacia la izquierda mientras miramos el mapa —está rodando, y
   el mundo se mueve más deprisa que él— y luego cruza el medio entero para
   echarse encima de la roca. Son 36 unidades de travesía, más de un tercio de
   la pantalla. */
const X_CRUCERO = -24;
/* 🚨 DONDE TOCA LA ROCA. Su dibujo está descentrado dentro de la caja —el
   cuerpo cae a unas 2,6u a la derecha del ancla y su hombro llega a unas 4,9u—
   y la roca mide 16u, o sea que su falda izquierda está en 17. Con él en 12 las
   dos siluetas se tocan justo, sin encajarse una en otra. */
const X_CHOQUE = 12;
/* 🚨 Y ADÓNDE LLEGA POR EL AIRE: AL MEDIO. Kiko, en la misma corrección: «que
   al chocar —por eso te decía el movimiento de la llave del coche— vaya desde
   donde choca con la roca hasta el medio, cayendo en el onsen».
   O sea que el golpe lo manda HACIA ATRÁS, que además es lo que hace de verdad
   una piedra: no lo empuja hacia delante, lo frena en seco y lo devuelve. Y el
   onsen queda centrado en la pantalla, que es donde tiene que estar el remate
   del acto. */
const X_ONSEN = 0;
/* La tabla sale despedida hacia el otro lado y se queda tumbada en la nieve.
   💭 Esto no lo dijo Kiko: dijo que se cae de la tabla, y en algún sitio tiene
   que caer. Dejarla tirada a la vista contesta de paso a lo que el acto 6
   tenía abierto —si el muñeco vuelve a llevar tabla o no—, y si no gusta se
   cambia este número por uno fuera de pantalla y desaparece. */
export const X_TABLA_CAE = -30;

/* 🚨 LO ALTO QUE VUELA, CON DOS TOPES Y NO UNO, igual que la montaña del acto
   4. La capa del dibujo se mide en vmin y la pantalla en svh: con solo 56u, en
   un portátil ancho el muñeco se iba media pantalla hacia arriba; con solo un
   tanto por ciento de la pantalla, en un móvil alto el golpe no se veía. */
const VUELO_PANTALLA = 0.42;
const VUELO_U = 90;
/* Lo que sube la tabla en su arco, bastante menos: es lo que sale por debajo de
   los pies, no lo que sale despedido. */
const TABLA_SALTO_U = 22;
/* 🚨 Y LO QUE HAY QUE LEVANTARLA AL FINAL PARA QUE SE POSE EN LA NIEVE.
   Parece un número mágico y no lo es: la tabla acaba tumbada, o sea girada
   casi media vuelta, y el giro es alrededor de la BASE de su caja. Al girar,
   el dibujo —que está pegado a esa base— se va al otro lado y queda por
   debajo de la línea del suelo… que en este acto es el borde de abajo de la
   pantalla, así que la tabla desaparecía de la película. Son 1,3 unidades de
   caída más media tabla de grosor. Se vio en la captura de WebKit, con una
   raya amarilla asomando por el canto inferior. */
const POSA_U = 2.0;

/* --------------------------------------------------------------------------
   🚨 LOS NÚMEROS QUE ESTÁN ESCRITOS EN DOS SITIOS
   --------------------------------------------------------------------------
   Van juntos y avisados a propósito: son la costura entre este archivo, el CSS
   y los dibujos, y cada uno tiene su dueño en otro sitio.

   De aquí sale UNA sola cuenta, y es la que hace que la escena funcione: cuánto
   hay que hundir al muñeco para que el agua le cruce por media espalda. Kiko:
   «vuelve a salir como hasta la mitad del torso… que se le ve solamente el
   torso hacia arriba».
   -------------------------------------------------------------------------- */
/* Lo ancho que es el onsen. 🚨 LO ESCRIBE ESTE ACTO Y EL CSS LO LEE, no al
   revés, porque la cuenta de abajo lo necesita: dos definiciones de la misma
   medida, una en CSS y otra aquí, es como el muñeco acaba flotando sobre el
   agua. Es lo mismo que se hizo con --monte-h en el acto 4. */
export const ONSEN_ANCHO_U = 32;
/* El eje del agua dentro de arte/onsen.svg: y=104 de un viewBox de 150 de alto,
   contando desde arriba. O sea que el agua queda a un 31 % de la altura de la
   pieza por encima del suelo. 🚨 Si se retoca el dibujo, se retoca esto. */
const AGUA_REL = 1 - 104 / 150;
/* Lo ancho que es el muñeco, que lo declara css/actos/04-takaragawa.css, y
   dónde le cae media espalda en la postura del onsen: el torso de
   arte/monigote.svg está centrado en y=96 de los mismos 150. */
const MONO_ANCHO_U = 20;
const MONO_TORSO_REL = 1 - 96 / 150;

/* Y la cuenta, hecha una vez. Todo en unidades del escenario. */
const ONSEN_ALTO_U = ONSEN_ANCHO_U * (150 / 300);
const AGUA_SOBRE_SUELO_U = ONSEN_ALTO_U * AGUA_REL;
const MONO_ALTO_U = MONO_ANCHO_U * (150 / 130);
/* 🚨 ESTE NÚMERO LO EXPORTA EL ACTO 5 Y LO IMPORTA EL 6, y es la única vez en
   toda la película que un acto importa de otro. Es a propósito: el acto 6
   empieza en el fotograma exacto en que acaba este (ley 5), con el muñeco
   metido en el agua justo a esta altura, y tiene que sacarlo de ahí. Escribir
   la cuenta otra vez allí serían dos definiciones del mismo número en dos
   archivos, que es la regla 1 del repositorio y es como el muñeco acaba
   flotando por encima del agua en un acto y no en el otro. */
export const HUNDIDO_U = MONO_ALTO_U * MONO_TORSO_REL - AGUA_SOBRE_SUELO_U;
/* Cuánto más se hunde mientras está debajo del agua, antes de volver a salir.
   Da igual que sea mucho: ahí abajo no se le ve. */
const FONDO_U = 26;

/* Cuánto fondo pasa mientras sigue rodando.
   🚨 EL ACTO 4 LO DEJA PARADO en 1.513 —1.150 heredados del acto 3 más los 363
   de su propia frenada—, así que aquí se arranca de ahí y se vuelve a mover: el
   guion dice «el muñequito sigue ahí esquiando». La curva es `suave` a
   propósito y no `frena`: arranca despacio —él se impulsa— y se posa despacio,
   y la roca cuelga de esta misma curva. */
const FONDO_HEREDADO = 1513;
const RODAJE = 300;
/* 🚨 DONDE SE QUEDA EL FONDO AL ACABAR ESTE ACTO, que es donde tiene que
   arrancar el 6. Exportado por lo mismo que HUNDIDO_U: escrito a mano allí,
   el bosque pega un salto en la costura el día que se toque cualquiera de los
   dos números de arriba. */
export const FONDO_AL_FINAL = FONDO_HEREDADO + RODAJE;

/* --------------------------------------------------------------------------
   El rebote del onsen
   --------------------------------------------------------------------------
   «Sube y rebota hacia abajo y baja un pelín, como para darles efecto de
   animación.» O sea: se pasa de largo y vuelve. Es una curva que llega a 1
   pasándose hasta 1,09 por el camino, y no hay forma de hacer eso con `suave`,
   que nunca se pasa.
   🚨 Va aquí y no en util.js a propósito: es lo único de toda la película que
   se pasa de su sitio, y meterlo en el motor sería inventar una herramienta
   para un solo uso.
   -------------------------------------------------------------------------- */
const REBOTE = 1.9;
function rebote(t) {
  const u = t - 1;
  return 1 + (REBOTE + 1) * u * u * u + REBOTE * u * u;
}

let sueloRel = 0.68;   /* se lee de --suelo al preparar el acto */

/* 🚨 LO QUE ESTE ACTO NO USA, LO APAGA (ley 1). Y no basta con que el acto 4
   las deje apagadas al terminar: saltando desde el raíl con el acto 4 a medias
   —con la montaña puesta, por ejemplo— el último fotograma que se pintó las
   tenía encendidas, y aquí no las tocaría nadie. */
function apagarLoDeAntes() {
  /* 🔁 Y SE DICE AL REVÉS DESDE EL ACTO 6 (ley 23): se declaran las piezas que
     este acto SÍ enseña y el motor apaga el resto. Antes era una lista de seis
     nombres ajenos, y el mono del acto 6 no habria estado en ella. */
  limpiarPiezas('monigote', 'tabla', 'roca', 'onsen', 'onsen-fondo');
  variable('--halo', 0);
  variable('--luces', 0);
  variable('--puertas', 0);
  /* La línea del suelo la trae la banda de bosque, igual que al final del acto
     4: dos líneas a la vez se ven como un error de impresión. */
  variable('--op-suelo', 0);
  /* 🚨 Y LOS ÁRBOLES A TOPE, que es la trampa que trajo el acto 6. --mezcla la
     escribia SOLO el acto 3; el 6 la baja a 0 para dejar al coche rodando sin
     bosque, y volviendo hacia atras este acto se quedaba con el manto de nieve
     pelado, sin un arbol. Igual que bajarSuelo: se escribe en cada fotograma
     porque es de una capa compartida y la barata es esta. Con 12 estan los
     nueve arboles puestos (RANURAS, en 03-al-coche.js). */
  variable('--mezcla', 12);
  /* Y la escena a su tamaño, por lo mismo: el acto 6 la encoge (ley 26) */
  zoomEscena(1);
}

export function montarActoKusatsu() {
  return registrarActo({
    id: 'kusatsu',
    el: document.getElementById('kusatsu'),

    preparar(acto) {
      /* 🚨 DÓNDE ESTÁ LA LÍNEA DEL SUELO, leída UNA vez de donde vive, que es
         base.css. Hace falta en píxeles para bajar el paisaje con `transform`
         en vez de moviendo `top`. getComputedStyle es caro: por eso se hace al
         preparar y no en cada fotograma. Lo mismo que hace el acto 4. */
      const capa = document.getElementById('dibujo');
      const leido = capa ? parseFloat(getComputedStyle(capa).getPropertyValue('--suelo')) : NaN;
      sueloRel = isNaN(leido) ? 0.68 : leido / 100;
    },

    /* 🚨 AL SALIR, SE RECOGE (ley 12), y aquí hay tres cosas distintas.

       El panel y el dato del viaje SIEMPRE, se salga por donde se salga: la
       escena de este acto se solapa una pantalla entera con la del 4 por arriba
       y con el cierre por abajo, y un panel encendido ahí sale impreso encima.

       El mapa pequeño SIEMPRE, y además DEVUELTO A SU TAMAÑO. Apagarlo no
       deshace el encogido: --mini se queda a 1 y la capa sigue medida y subida.
       Es la ley 16, y ya pasó entre el acto 1 y el 2 y otra vez con el 4.

       La roca, el onsen y la POSTURA del muñeco SOLO SI SE SALE POR ARRIBA.
       Son piezas de una capa compartida y el acto 4 no sabe que existen, así
       que volviendo hacia atrás se quedarían flotando sobre el bosque. Y la
       postura importa tanto como las piezas: sin devolverla, al subir al acto 4
       el muñeco bajaría la montaña sentado en una bañera que ya no está.
       Saliendo por abajo NO se apagan: ahí el dibujo entero se va cayendo poco
       a poco (principal.js), y cortarlas de golpe es justo lo que Kiko no
       quería: «de repente desaparece y tarda un rato en llegar lo otro».

       🚨 Y POR DÓNDE SE HA SALIDO SE PREGUNTA A LA PÁGINA, NO SE DEDUCE DEL
       ÚLTIMO FOTOGRAMA PINTADO (ley 17). Saltando desde el raíl, el acto sale
       de golpe sin pintar nada por el camino, así que el último `p` sigue
       siendo el de donde estabas. Con la caja de la sección no hay nada que
       deducir. */
    salir(acto) {
      acto.v('--p-datos', 0);
      acto.v('--p-sube', 0);
      acto.v('--p-viaje', 0);
      mostrarLienzo(false);
      limpiarRutas(0);
      empequeñecerMapa(0);
      if (acto.el.getBoundingClientRect().top > 0) {
        limpiarPiezas('monigote', 'tabla');
        postura('monigote', 'tabla');
      }
    },

    pintar(p, acto) {
      mostrarDibujo(true);

      /* La unidad del escenario en píxeles, que hace falta para todo lo que se
         mueve en vertical: la `y` del muñeco y la de la tabla van en píxeles
         desde el acto 4. */
      const altoPantalla = window.innerHeight;
      const unidad = Math.min(window.innerWidth, altoPantalla) / 100;

      /* ================================================================
         EL PAISAJE · lo que se hereda del acto 4 y sigue puesto
         ================================================================
         🚨 EL SUELO SIGUE ABAJO DEL TODO, y hay que volver a escribirlo en cada
         fotograma. Son variables de una capa compartida y el acto 3 las
         devuelve a cero en cuanto pinta: saltando desde el raíl a media caída
         sin pasar por el acto 4, el bosque se quedaría a media pantalla y el
         onsen subiría hasta una línea de suelo que no está donde parece.
         Lo barato es escribir un número; lo caro es el fallo. */
      apagarLoDeAntes();
      nieveHastaElSuelo(1);
      bajarSuelo(altoPantalla * (1 - sueloRel));
      verBanda('ciudad', 0);
      verBanda('bosque', 0);
      verBanda('bosque-nevado', 1);
      /* «Y sigue nevando», de principio a fin del acto. Y del 6 */
      nevar(1);

      /* El mundo se vuelve a mover: él sigue rodando. Y de esta misma curva
         cuelga la roca, para que las dos cosas compartan velocidad. */
      const mundo = suave(tramo(p, F.rueda[0], F.rueda[1]));
      desplazarFondo(FONDO_HEREDADO + RODAJE * mundo);

      /* ================================================================
         A · VUELVE EL MAPA, Y SE COMPLETA LA RUTA
         ================================================================
         «Vuelve el mapa. Se completa la ruta en coche del primer sitio al
         segundo.» Es la MISMA capa del mapa de siempre, encogida y subida: ni
         un segundo mapa ni una segunda cámara, así que la ruta y los marcadores
         funcionan igual que en los actos 1 y 2. */
      const opMapa = 0.92 *
        suave(tramo(p, F.mapaEntra[0], F.mapaEntra[1])) *
        (1 - suave(tramo(p, F.mapaSeVa[0], F.mapaSeVa[1])));

      if (opMapa > 0.004) {
        viajarDeVista(V_NORTE, V_NORTE, 0);
        empequeñecerMapa(1);
        mostrarLienzo(true);
        alzarLienzo(1);
        opacidadMapa(opMapa);
        pintarMapa();
        /* De dónde venimos y adónde vamos. 🚨 Kusatsu se enciende ANTES de que
           la línea llegue, como todos los destinos de esta web: la carretera no
           va a ciegas. */
        marcar('takaragawa', LUGARES.takaragawa, 1);
        marcar('kusatsu', LUGARES.kusatsu, 1);
  /* 🚨 Y TODO LO DEMÁS SE APAGA, SIN NOMBRARLO. Antes aquí había una lista
         de `esconder()` escrita a mano, y esa lista tenía que adivinar los
         marcadores de los actos futuros: cuando el acto 5 estrenó Kusatsu, su
         punto se quedaba encendido sobre el globo hasta el vuelo a Madrid.
         Un acto no sabe qué marcadores vendrán; sabe cuáles son suyos. */
        limpiarHitos('takaragawa', 'kusatsu');

        const avance = tope((p - F.ruta[0]) / (F.ruta[1] - F.ruta[0]));
        pintarRuta(0, RUTA, avance, { color: 'var(--acento)', guion: false });
        cerrarHalo('kusatsu', avance);
        limpiarRutas(1);
      } else {
        /* 🚨 Y AL APAGARLO, DEVOLVERLO A SU TAMAÑO (ley 16). Apagar el mapa no
           deshace el encogido, y el acto 6 vuelve a encenderlo: volvería
           diminuto y pegado al techo. */
        mostrarLienzo(false);
        limpiarRutas(0);
        empequeñecerMapa(0);
      }

      /* ================================================================
         B · LA ROCA
         ================================================================
         «Va apareciendo una roca chiquitita por la derecha hasta que llega al
         medio y se queda estática.»

         🚨 VA COLGADA DE LA CURVA DEL MUNDO, no de una ventana propia. Así la
         roca y los árboles se mueven exactamente a la misma velocidad y frenan
         a la vez: si tuviera su propia curva, la roca parecería una pieza que
         se desplaza sola por delante de un fondo que va a otro ritmo. */
      const tRoca = tramo(mundo, MUNDO_ROCA, 1);
      colocar('roca', {
        x: mezcla(X_ROCA_ENTRA, X_ROCA_PARA, tRoca),
        y: 0,
        op: tRoca > 0 ? 1 : 0,
        escala: 1
      });

      /* ================================================================
         C · EL GOLPE, Y LA TABLA QUE SE VA
         ================================================================
         «El muñeco se choca con ella y al chocarse con ella, como que se cae de
         la tabla y sube hacia arriba en diagonal, como hacia la llave, ese
         movimiento más o menos. Entonces, cae hacia abajo.»

         Tres tramos seguidos y una sola trayectoria:
           · crucero  deriva a la izquierda mientras miramos el mapa
           · embiste  se echa encima de la roca, acelerando
           · vuelo    diagonal recta hacia arriba y a la derecha, frenando
           · caída    y se deja caer, acelerando, hasta el agua

         🚨 LA DIAGONAL ES RECTA A PROPÓSITO. Kiko la comparó con la llave del
         acto 3, y de la llave dijo dos veces lo mismo: «que vaya en diagonal,
         como desde donde te la dan hacia arriba, como en una diagonal
         perfecta». Las dos coordenadas con la misma fase. */
      const tEmbiste = tramo(p, F.embiste[0], F.embiste[1]);
      const tVuelo = tramo(p, F.vuelo[0], F.vuelo[1]);
      const tCaida = tramo(p, F.caida[0], F.caida[1]);

      /* Lo alto que vuela, con los dos topes. En píxeles, como manda su CSS. */
      const alturaVuelo = Math.min(altoPantalla * VUELO_PANTALLA, unidad * VUELO_U);
      const hundido = HUNDIDO_U * unidad;

      let xMono;
      if (tVuelo <= 0) {
        /* Crucero y embestida. La derivada va con `suave` —está rodando, no
           frenando— y la embestida al cuadrado, para que parezca que se echa
           encima y no que llega andando. */
        const deriva = mezcla(0, X_CRUCERO, suave(tramo(p, 0, F.rueda[1] * 0.98)));
        xMono = mezcla(deriva, X_CHOQUE, tEmbiste * tEmbiste);
      } else {
        /* 🚨 LA DIAGONAL ES RECTA Y ACABA EN EL MEDIO, Y DE AHÍ CAE A PLOMO.
           Kiko lo describió dos veces con la misma imagen —el movimiento de la
           llave del acto 3— y en la corrección lo cerró del todo: «vaya desde
           donde choca con la roca hasta el medio, cayendo en el onsen».

           Así que son dos tramos y no una parábola: la SUBIDA lleva las dos
           coordenadas con la MISMA fase —`frena` aquí y `frena` en la altura,
           tres líneas más abajo—, que es lo que hace que sea una recta y no una
           curva; y la CAÍDA es vertical, justo encima del onsen. La llave hizo
           exactamente esto y él la dio por buena a la segunda. */
        xMono = tCaida > 0 ? X_ONSEN : mezcla(X_CHOQUE, X_ONSEN, frena(tVuelo));
      }

      /* La altura: sube frenando —la gravedad le va quitando— y baja
         acelerando. Y al final del todo se pasa de largo hacia abajo: eso es
         que se ha metido en el agua. */
      let yMono = 0;
      if (tCaida > 0) {
        yMono = mezcla(-alturaVuelo, hundido + FONDO_U * unidad, tCaida * tCaida);
      } else if (tVuelo > 0) {
        yMono = -alturaVuelo * frena(tVuelo);
      }
      /* Y al salir, sube del fondo hasta quedarse con el agua por media
         espalda. `frena` para que aflore y se pose, no para que rebote. */
      const tEmerge = tramo(p, F.emerge[0], F.emerge[1]);
      if (tEmerge > 0) yMono = mezcla(hundido + FONDO_U * unidad, hundido, frena(tEmerge));

      /* 🚨 DESAPARECE AL CRUZAR EL AGUA, que es literal: «cae en él, desaparece
         y vuelve a salir». La mitad de delante del onsen ya le tapa de cintura
         para abajo, pero la cabeza no: sin esto se le vería hundirse entero
         como si el agua fuera un cristal. */
      const opMono = (1 - suave(tramo(p, F.tragado[0], F.tragado[1]))) +
        suave(tramo(p, F.emerge[0], F.emerge[0] + (F.emerge[1] - F.emerge[0]) * 0.45));

      /* La postura cambia DEBAJO DEL AGUA, donde no se ve: no es un fundido,
         es un interruptor. Y se escribe en la pieza y no en la capa, que es la
         ley 19. */
      postura('monigote', p >= F.tragado[1] ? 'onsen' : 'tabla');

      /* Se lo lleva por delante: un giro corto hacia atrás mientras vuela, que
         es lo que hace que se lea «se cae» y no «salta». Con la vuelta entera
         parecía una voltereta de dibujos animados, que es otra película. */
      const giro = -38 * suave(tope(tVuelo + tCaida));

      colocar('monigote', {
        x: xMono,
        y: yMono,
        op: Math.min(1, opMono),
        escala: 1,
        giro: tEmerge > 0.2 ? 0 : giro
      });

      /* --- La tabla -----------------------------------------------------
         Hasta el golpe va pegada a él —misma x, misma y, mismo giro, que es
         para lo que comparten caja—. Desde el golpe sale por el otro lado
         dando vueltas y se queda tumbada en la nieve. */
      const tTabla = tramo(p, F.tablaVuela[0], F.tablaVuela[1]);
      if (tTabla <= 0) {
        colocar('tabla', { x: xMono, y: yMono, op: 1, escala: 1, giro: 0 });
      } else {
        colocar('tabla', {
          x: mezcla(X_CHOQUE, X_TABLA_CAE, suave(tTabla)),
          /* Un arco corto: sube y vuelve al suelo. El seno hace las dos cosas
             con una línea y llega a cero exacto por los dos lados. */
          y: -TABLA_SALTO_U * unidad * Math.sin(Math.PI * tTabla) - POSA_U * unidad * suave(tTabla),
          op: 1,
          escala: 1,
          /* Acaba tumbada y un pelo torcida: una tabla que cae en la nieve no
             queda alineada con el horizonte. */
          giro: -172 * suave(tTabla)
        });
      }

      /* ================================================================
         D · EL ONSEN, QUE SUBE DESDE DEBAJO DE LA PANTALLA
         ================================================================
         «Mientras cae, aparece por debajo de forma muy minimalista un onsen…
         de esto que sube y rebota hacia abajo y baja un pelín como para darles
         efecto de animación.»

         🚨 LAS DOS MITADES VAN AL MISMO SITIO, SIEMPRE. Son un solo dibujo
         partido por el eje del agua con el muñeco metido en medio: la de atrás
         por detrás de él, la de delante tapándole de cintura para abajo. En
         cuanto una se mueva un píxel más que la otra, se ve la juntura. */
      variable('--onsen-ancho', ONSEN_ANCHO_U);
      const tOnsen = tramo(p, F.onsenSube[0], F.onsenSube[1]);
      /* De debajo del borde de abajo hasta posarse en el suelo. Sale de su
         propia altura más un margen: así empieza entero fuera de la pantalla. */
      const yOnsen = (ONSEN_ALTO_U + 3) * (1 - rebote(tOnsen));
      const sitioOnsen = { x: X_ONSEN, y: yOnsen, op: tOnsen > 0 ? 1 : 0, escala: 1 };
      colocar('onsen-fondo', sitioOnsen);
      colocar('onsen', sitioOnsen);

      /* ================================================================
         EL TEXTO
         ================================================================
         Todo en placeholder: de Kusatsu no hay nada elegido todavía. Lo único
         con dato es lo que dura el tramo, y va marcado por verificar porque el
         tiempo sale de medir la carretera a velocidad libre. */
      acto.v('--p-viaje',
        suave(tramo(p, F.viajeDent[0], F.viajeDent[1])) *
        (1 - suave(tramo(p, F.viajeFuer[0], F.viajeFuer[1]))));
      /* 🚨 DOS VARIABLES PARA EL PANEL, Y NO UNA, como en el acto 4: --p-sube
         es el viaje y SOLO VA HACIA DELANTE, --p-datos es lo que se ve. Así al
         final se desvanece quieto en su sitio en vez de irse otra vez por donde
         vino. */
      acto.v('--p-sube', suave(tramo(p, F.datosSube[0], F.datosSube[1])));
      acto.v('--p-datos',
        suave(tramo(p, F.datosDent[0], F.datosDent[1])) *
        (1 - suave(tramo(p, F.datosFuer[0], F.datosFuer[1]))));
    }
  });
}
