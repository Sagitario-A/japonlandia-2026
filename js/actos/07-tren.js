/* =============================================================================
   actos/07-tren.js · El tren a Kioto
   -----------------------------------------------------------------------------
   Guion literal → web-nueva/DEFINICION.md, acto A7. En orden:

     A · LA ESTACIÓN  «cuando lleguemos a Matsumoto, se hace zoom hacia la
                      estación» hasta que «lo único que queda es un tren que se
                      ve desde en vertical, desde arriba hasta abajo, como una
                      barra, pero que parezca que es un tren», a la DERECHA
     B · EL TRAYECTO  «dejando el hueco de la izquierda como si tuviese que ver
                      un tren también, pero no lo hay», y en ese hueco «va
                      apareciendo la duración y demás del trayecto hasta que
                      llegamos a donde se hace el transbordo»
     C · EL TRANSBORDO «se pone en paralelo con un tren igual, pero en el lado
                      izquierdo, que aparece desde abajo. El tren de la
                      izquierda es el que continúa, el de la derecha se sube
                      hacia arriba y los otros datos aparecen en el lado de la
                      derecha»
     D · LA LLEGADA   «llega a una estación»
     E · KIOTO        «según sigues haciendo scroll, se va haciendo zoom out y va
                      apareciendo el mapa de Kioto y desaparece el tren hasta
                      que solo queda el mapa de Kioto»

   🔁 Y LA PRIMERA RONDA DE KIKO SOBRE EL ACTO PUBLICADO, del 20 de septiembre,
   que cambia cuatro cosas y una de ellas es el acto entero:

     1 · «Al hacer zoom en Matsumoto, al igual que antes pasaba en Tokio, tienen
          que aparecer las calles, y hasta tal punto en el que se amplía el punto
          donde está la estación de Matsumoto, donde se coge el tren, y **sea el
          propio trazo de la línea de las vías lo que acaba siendo la vía donde
          está el tren**.»
     2 · «El intercambio se tiene que hacer en una estación de tren.»
     3 · «La vía del otro tren no tiene que venir junto desde abajo; sí tiene que
          venir desde abajo, pero tiene que estar junto a la estación.»
     4 · 🚨 «Parece que cuando llegamos al transbordo es la vía de la izquierda
          la que sube, cuando debería parecer que está estática y es la de la
          derecha la que baja hasta abajo, y luego la de la izquierda la que
          continúa. Que por cierto va para arriba, pero **tendría que continuar
          para abajo, porque al final es un viaje unidireccional en una
          dirección**.»

   🚨 LA CUARTA ES LA GORDA, Y TENÍA RAZÓN POR UN MOTIVO QUE NO SE VE LEYENDO EL
   CÓDIGO: **la escena se contradecía a sí misma**. El andén venía desde abajo
   —lo correcto si el viaje BAJA— mientras las traviesas corrían hacia abajo
   —lo correcto si el viaje SUBE—. El ojo se queda con lo que se repite, que son
   las traviesas, y por eso el tren parecía ir hacia arriba mientras la estación
   le venía de frente. Ahora todo baja: **el mundo corre hacia arriba, el tren
   apunta al sur y las estaciones llegan desde abajo**. Y encaja con el mapa,
   que es de donde venía la intuición de Kiko: Matsumoto está al norte y Kioto
   al sur, así que el viaje baja por la pantalla igual que baja por el mapa.

   🚨 ESTE ACTO CAMBIA EL PUNTO DE VISTA, y es el único de los ocho que lo hace.
   Los seis anteriores se miran de lado y todo se apoya en la línea del suelo.
   Aquí se mira desde arriba. El acto entero está construido sobre esa idea:
   **la cámara sube** al empezar —el paisaje de la nieve se hunde por debajo del
   canto de abajo— y **vuelve a subir** al acabar, cuando la vía se va por donde
   vino y deja el mapa de Kioto. Lo de en medio pasa visto desde el aire.

   🚨 Y EL TREN NO SE MUEVE: SE MUEVE LA VÍA. Es el truco del coche del acto 3
   girado noventa grados, y aquí es obligatorio, no una opción: el tren cruza la
   pantalla de canto a canto, así que moverlo sería sacarlo de cuadro. Lo que
   corre es el suelo, igual que corría el bosque — y corre HACIA ARRIBA, que es
   lo que hace que el tren se lea bajando.

   🚨 DÓNDE EMPIEZA (leyes 5 y 24). En el último fotograma del acto 6, que es lo
   que está publicado: el castillo de Matsumoto pegado al borde izquierdo, los
   Alpes al fondo, el coche centrado rodando sobre la carretera nevada SIN
   BOSQUE, la escena con el ZOOM OUT puesto al 0,60, el suelo abajo del todo,
   nevando, y arriba el mapa pequeño con la ruta a Matsumoto completa.

   🚨 Y NADA DE ESO SE HEREDA SOLO: SE PINTA, EN CADA FOTOGRAMA. Saltando desde
   el raíl, el acto 6 no pinta, no sale y no prepara nada (ley 20). Son CINCO
   cosas de capas compartidas —el zoom, el suelo bajado, los árboles apagados,
   las piezas y la nevada— y van todas juntas en `escenaHeredada()`, copiado del
   acto 6 y ampliado con la quinta.

   🚨 LAS POSICIONES VAN EN UNIDADES DEL ESCENARIO, que mide 100u de ancho —de
   -50 a +50—, y aquí además se usa el ALTO en unidades, que es lo que casi
   ningún acto necesita: `altoU`. En un móvil de 390×844 son 216 unidades; en un
   portátil de 1440×900, 100. Todo lo que tenga que salir por arriba o por abajo
   se calcula con ese número y no con uno escrito a mano (ley 27).
   ============================================================================= */

import { registrarActo } from '../motor/escenario.js?v=822ac628';
import { tramo, suave, tope, frena, mezcla, RAD } from '../motor/util.js?v=822ac628';
import { encuadrar, viajarDeVista } from '../motor/proyeccion.js?v=822ac628';
import { pintarMapa, pintarRuta, limpiarRutas, marcar, mostrarLienzo, opacidadMapa, cerrarHalo, alzarLienzo, empequeñecerMapa, limpiarHitos, engordarVias } from '../motor/lienzo.js?v=822ac628';
import { mostrarDibujo, colocar, variable, verBanda, desplazarFondo, bajarSuelo, limpiarPiezas, zoomEscena } from '../motor/dibujo.js?v=822ac628';
import { nevar, nieveHastaElSuelo } from '../motor/nieve.js?v=822ac628';
import { tenderRuta } from '../motor/ruta.js?v=822ac628';
import { LUGARES, RUTA_A_MATSUMOTO, ENCUADRES } from '../datos/rutas.js?v=822ac628';
/* 🚨 LO ÚNICO QUE ESTE ACTO IMPORTA DE OTRO, y es a propósito, igual que el
   acto 6 importa cinco números del 5: son el fotograma del que arranca (ley 5).
   Escritos a mano aquí serían el mismo número en dos archivos —regla 1 del
   repositorio— y el día que alguien mueva el zoom del acto 6 o el ancho del
   castillo, este acto abriría con las cosas en otro sitio. */
import { ZOOM_FIN, PICO_ANCHO_U, CASTILLO_ANCHO_U, FONDO_AL_FINAL_6 } from './06-yamanouchi.js?v=822ac628';

function vista(clave) {
  const e = ENCUADRES[clave];
  return [e[0], e[1], encuadrar(e[2])];
}

/* Los encuadres del acto: de donde lo deja el 6, la parada en escala de calle
   sobre Matsumoto, el empalme con la vía y Kioto, que es donde acaba. */
const V_MATSUMOTO = vista('matsumoto');
const V_CALLE = vista('matsumotoCalle');
const V_KIOTO_CERCA = vista('kiotoCerca');
const V_KIOTO = vista('kioto');

/* 🚨 LA RUTA DEL ACTO 6, ENTERA, Y ESTO ES LEY 5 PURA. El acto anterior acaba
   con la carretera de Yamanouchi a Matsumoto DIBUJADA y sus dos marcadores
   encendidos; si este acto abriera el mapa sin ella, en la costura
   desaparecerían de golpe una línea y una etiqueta. Se vio en la primera
   captura del acto: en el fotograma cero había castillo, coche y nieve en su
   sitio, y el mapa de arriba se había quedado en un punto suelto.
   No se vuelve a tender: es la misma tabla del acto 6, pedida otra vez. */
const RUTA_MATSUMOTO = tenderRuta(RUTA_A_MATSUMOTO, 0.2);

/* --------------------------------------------------------------------------
   El reparto del scroll
   --------------------------------------------------------------------------
   🚨 EL ACTO MIDE 2.000 svh: veinte pantallas, el segundo más largo de los
   siete. NORMAS § 9 le había presupuestado 700 antes de construirlo, y la
   historia de los cinco actos anteriores es que el presupuesto siempre se queda
   corto: el 3 pasó de 1.300 a 2.400, el 4 de 800 a 1.100, el 5 de 700 a 1.000 y
   el 6 de 800 a 1.900. Kiko: «el largo lo eliges tú y lo ajustas mirándolo en
   pantalla; prefiero que cada golpe respire».

   🔁 Y CRECIÓ DE 1.700 A 2.000 EN LA PRIMERA RONDA, que es lo que cuesta el
   zoom pedido: ahora la cámara hace DOS paradas sobre Matsumoto —la escala de
   calle y la estación— y encima tiene que darle tiempo a la línea de la vía a
   engordar hasta convertirse en la vía del tren. Ese relevo no se puede meter
   con calzador: si se ve venir, no es un relevo, es un corte.

   El reparto, en pantallas de las veinte:
     la estación        7,0   se va el coche y la nieve, el mapa crece, enseña
                              las calles, entra en la estación, la línea de la
                              vía engorda y la recoge el dibujo; llega el tren
     el trayecto        5,0   corre la vía y a la izquierda se cuenta el tramo
     el transbordo      2,8   llega la estación de Nagoya con el otro tren ya
                              esperando, y el nuestro se va hacia abajo
     el segundo tramo   3,8   corre otra vez, más deprisa, y llega el andén
     Kioto              1,4   zoom out, se hunde la vía y aparece el mapa

   (suman más de veinte porque las ventanas SE SOLAPAN a propósito: una cosa
   entra mientras la anterior se está yendo)
   -------------------------------------------------------------------------- */
const F = {
  /* A · la salida de la nieve.
     🚨 EL ORDEN DE ESTAS CUATRO VENTANAS ES LA ESCENA. Primero se va el coche
     —que es lo último que hacía el acto 6—, después deja de nevar, después se
     hunde el paisaje, y solo cuando ya no queda nada abajo vuelve el zoom a su
     tamaño. Si el zoom volviera antes, se vería la escena entera crecer con las
     montañas todavía puestas, que es un movimiento que nadie ha pedido. */
  salida: [0.008, 0.120],
  deja: [0.015, 0.120],
  hunde: [0.040, 0.125],
  /* 🚨 Y EL ZOOM VUELVE A 1 CON LA PANTALLA YA VACÍA. Es la ley 26 con la
     variable que estrenó el acto 6: alguien tiene que devolverla, y aquí se
     devuelve en el único momento en que no se ve. */
  zoomVuelve: [0.128, 0.150],

  /* A.bis · el mapa: crece, para en escala de calle, entra en la estación y
     entrega el trazo de la vía. Son DOS paradas de cámara y no una, igual que
     el acto 3 sobre Shinjuku: sin la primera, el callejero aparecería con el
     mapa ya medio disuelto y no daría tiempo a verlo. */
  mapaCrece: [0.015, 0.095],
  zoomCiudad: [0.015, 0.130],
  /* 🚨 YAMANOUCHI SE APAGA EN CUANTO LA CÁMARA SE MUEVE, y es la ley 22: su
     etiqueta son once letras, y al cerrarse el encuadre sobre Matsumoto el
     punto se va hacia el borde derecho y se leía «YAMANO». Se vio en la
     captura, no en el código. Está ahí por la costura —el acto 6 lo deja
     encendido— y se va en cuanto deja de hacer falta. */
  hitoYamanouchi: [0.018, 0.068],
  zoomEstacion: [0.132, 0.250],
  /* 🚨 LA LÍNEA DE LA VÍA ENGORDA, que es el relevo que pidió Kiko — Y LO HACE
     TARDE Y DEPRISA, A LA VEZ QUE EL MAPA SE DISUELVE.
     🔁 La primera versión la engordaba durante todo el zoom a la estación, y en
     la captura se vio por qué está mal: a mitad de camino las vías todavía van
     curvando entre la ciudad, así que lo que se ve engordar no es una vía, es
     un RÍO gris serpenteando por el callejero. Engordando solo al final, cuando
     la cámara ya está sobre el tramo recto y el mapa se está yendo, lo único
     que le da tiempo a leer al ojo es que la línea se ensancha y se convierte
     en la vía. */
  viasEngordan: [0.222, 0.264],
  /* Y el dibujo la recoge: las dos se solapan, alineadas, y el mapa se disuelve
     encima. No es una aparición: es una entrega. */
  empalme: [0.230, 0.270],
  mapaSeVa: [0.234, 0.280],

  /* 🚨 Y EL TREN LLEGA DESDE ARRIBA, QUE ES DE DONDE VENIMOS. Estamos parados en
     el andén de Matsumoto y el tren entra en la estación: baja, frena y se para.
     Con el viaje bajando por la pantalla, un tren que entra en una estación
     entra por arriba — al revés que las estaciones, que nos vienen de frente
     porque somos nosotros los que nos movemos. */
  trenLlega: [0.270, 0.342],

  /* B · el trayecto. Matsumoto → Nagoya: la vía corre a velocidad de crucero y
     frena al final, que es lo que hace un tren que entra en una estación. */
  tramo1: [0.348, 0.600],
  viaje1Dent: [0.372, 0.414],
  /* 🚨 Y SE VA ANTES DE QUE ASOME LA ESTACION DE NAGOYA, no cuando el tramo
     acaba. Se vio en la captura del transbordo: el rotulo del primer tramo
     seguia puesto encima del shinkansen que ya estaba esperando, y no se leia
     ni el texto ni el tren. La estacion entra en cuadro cuando le faltan unas
     330 unidades, o sea a mitad del tramo: el texto tiene que haberse ido. */
  viaje1Fuer: [0.462, 0.498],

  /* C · el transbordo, en Nagoya.
     🚨 AQUÍ NO SE MUEVE MÁS QUE EL TREN QUE SE VA. Kiko: «debería parecer que
     [la vía de la izquierda] está estática y es la de la derecha la que baja
     hasta abajo». La estación entera —el andén, la vía de la izquierda y el
     shinkansen ya esperando en ella— ha llegado ANTES, de frente, mientras
     todavía nos movíamos. Cuando paramos, lo único que se mueve es nuestro tren
     yéndose. */
  seVa1: [0.628, 0.700],
  viaje2Dent: [0.700, 0.750],

  /* D · el segundo tramo: Nagoya → Kioto, 35 minutos para 135 km. Va MUCHO más
     deprisa que el primero y esa diferencia es el dato: son los mismos golpes
     de vía pasando al doble y medio de ritmo. */
  tramo2: [0.742, 0.930],
  total: [0.800, 0.850],
  /* 🚨 Y LOS DOS DATOS SE VAN ANTES DE QUE ENTRE EL MAPA DE KIOTO. Se vio en la
     captura: con el tren hundiéndose y el mapa apareciendo, el rótulo del
     segundo tramo se quedaba encima de los dos y no se leía ninguno de los
     tres. El final es «hasta que solo queda el mapa de Kioto», y solo quiere
     decir solo. */
  datosFuer: [0.906, 0.942],

  /* E · Kioto.
     🚨 EL FINAL RIMA CON EL PRINCIPIO: el acto empieza hundiendo el paisaje de
     la nieve para subir al aire, y acaba hundiendo la vía por el mismo sitio.
     Es la única forma de que el dibujo desaparezca MOVIÉNDOSE —el fundido es
     para el mapa y el texto— y de que «solo quede el mapa de Kioto». */
  zoomFuera: [0.930, 0.972],
  hundeVia: [0.936, 0.992],
  mapaKioto: [0.930, 1.000],
  mapaEntra: [0.942, 0.988]
};

/* --------------------------------------------------------------------------
   Dónde para cada cosa
   -------------------------------------------------------------------------- */

/* 🚨 LOS DOS TRENES VAN A LA MISMA DISTANCIA DEL EJE, uno a cada lado. En un
   móvil la pantalla mide 100u de ancho, el tren mide 24 y la vía 30: con los
   ejes en ±26, la vía de la derecha ocupa de 11 a 41 y la de la izquierda de
   -41 a -11, así que quedan 22 unidades libres en el medio —justo lo que mide
   el andén— y 9 por fuera de cada lado. El hueco para los datos es el que deja
   el tren que no está: media pantalla. */
const X_VIA = 26;
const ANCHO_VIA_U = 30;

/* 🚨 EL PERÍODO DE LA VÍA, Y ESTE NÚMERO VIVE EN DOS SITIOS.
   arte/via.svg repite su dibujo cada 100 unidades de un viewBox de 1200, y la
   pieza mide 360u de alto: 100 × 360 / 1200 = 30u por período. Es lo que
   permite que el desplazamiento dé la vuelta sin que se vea la costura, igual
   que las copias de la banda del bosque del acto 3.
   ⚠️ Si alguien cambia el ritmo de las traviesas o de los postes en el dibujo,
   este número hay que cambiarlo aquí. Va avisado en la cabecera del .svg. */
const PERIODO_VIA = 30;
const ALTO_VIA = 360;

/* Dónde se planta la vía cuando ya está puesta: un período por encima del borde
   de arriba, para que al dar la vuelta el bucle nunca enseñe su canto. */
const Y_VIA = -PERIODO_VIA;

/* Lo que miden las piezas que cruzan la pantalla, para poder sacarlas de cuadro
   sin números a ojo (ley 27). Están en css/actos/07-tren.css. */
const ALTO_TREN = 300;
const ALTO_ANDEN = 170;

/* 🚨 EL MORRO TIENE QUE VERSE, Y AHORA VA ABAJO.
   Kiko eligió el 18 de septiembre dibujar los dos trenes del mismo tamaño y con
   el morro distinto, y el 20 corrigió el sentido del viaje: baja. Así que el
   morro apunta al sur y se planta unas unidades por encima del canto de abajo,
   que es lo que permite compararlos en el transbordo. El cuerpo se va por
   arriba: «de arriba abajo, como una barra» se sigue leyendo igual. */
const MARGEN_MORRO = 30;

/* Lo que recorre la vía en cada tramo, en unidades.
   🚨 LA PROPORCIÓN ENTRE LOS DOS ES EL DATO, y por eso no son dos números
   redondos cualesquiera: el Shinano tarda dos horas en 188 km y el shinkansen
   treinta y cinco minutos en 135. Aquí el segundo tramo pasa 1.150 unidades de
   vía en menos scroll que las 900 del primero, o sea a casi el doble de ritmo.
   Eso es lo único que dice «hemos cambiado a un tren rápido» sin escribirlo en
   ningún sitio.
   💭 Y no más: con la vía a más ritmo, un scroll rápido empieza a solapar las
   traviesas —que van cada 15u— y el dibujo parpadea. Es el mismo techo que
   tiene la nevada del acto 3, y se mide mirando, no calculando. */
const LARGO_1 = 900;
const LARGO_2 = 1150;

/* Dónde para el andén.
   🚨 EN NAGOYA VA EN EL CENTRO Y EN KIOTO A LA IZQUIERDA, y no es un capricho:
   en Nagoya hay DOS vías —la nuestra a la derecha y la del shinkansen a la
   izquierda— y el andén va entre las dos, que es lo que es un andén de isla. En
   Kioto ya solo queda una vía, la de la izquierda, y el andén se le pega por su
   costado derecho — que además es lo que deja sitio al texto. */
const X_ANDEN_NAGOYA = 0;
const X_ANDEN_KIOTO = -3;
const Y_ANDEN = 26;

/* Cuánto mundo pasa mientras se va el coche y con él el decorado de la nieve.
   🚨 EN NEGATIVO SOBRE LO QUE DEJA EL ACTO 6, o sea que el fondo sigue corriendo
   hacia la derecha: es el mismo sentido con el que acaba el acto anterior —el
   coche va al oeste— y cortarlo aquí se vería como un frenazo en la costura.
   Es menos de lo que recorre el acto 6 al final (560) porque esto no es un
   viaje: es el último tramo hasta la puerta de la estación. */
const SALIDA_FONDO = 300;

/* Lo ancho que es el coche, para saber cuándo ha salido del todo.
   ⚠️ Está escrito en dos sitios, aquí y en css/actos/03-al-coche.css, que es
   donde vive de verdad. No hay forma limpia de que el CSS se lo diga al acto
   sin leer estilos en cada fotograma, que es caro; si alguien cambia el tamaño
   del coche, este número se cambia con él. */
const ANCHO_COCHE_U = 46;

/* Hasta dónde se aleja la cámara al final, cuando aparece el mapa de Kioto.
   💭 0,45 es bastante más lejos que el 0,60 del acto 6, y aquí se puede: allí
   había un bosque que tenía que seguir llegando a los dos bordes y aquí solo
   hay dos barras sobre papel en blanco. Cuanto más lejos se va, más sitio deja
   para que el mapa entre por debajo. */
const ZOOM_FUERA = 0.45;

/* --------------------------------------------------------------------------
   🚨 EL EMPALME · dónde tiene que caer la línea de la vía del mapa
   --------------------------------------------------------------------------
   Kiko, primera ronda: *«que sea el propio trazo de la línea de las vías lo que
   acaba siendo la vía donde está el tren»*. Para que una línea del mapa pueda
   convertirse en la vía dibujada hacen falta tres cosas, y ninguna se puede
   escribir a ojo:

     1 · Que la línea sea VERTICAL en pantalla. Eso lo da la geografía: el
         encuadre apunta al tramo recto de la línea Shinonoi 273 m al sur de la
         estación, donde las vías corren a 0,2° de la vertical (ver rutas.js).
     2 · Que caiga en el EJE de la vía dibujada, o sea en X_VIA. Como la cámara
         del mapa se apunta por su centro, hay que correrla al oeste justo lo que
         mide esa distancia — y eso depende del radio, así que **se calcula**.
     3 · Que tenga el mismo ANCHO. La línea engorda hasta el ancho del balasto.

   📐 La cuenta del 2: el motor proyecta `px = R · (lon − lonVista) · cos(lat)`
   con los ángulos en radianes, y el `viewBox` del mapa mide 260 unidades en el
   lado corto de la pantalla, que es donde el dibujo mide 100. O sea que una
   unidad del dibujo son 2,6 del mapa.
   -------------------------------------------------------------------------- */
const MAPA_POR_UNIDAD = 2.6;

function vistaEmpalme() {
  const e = ENCUADRES.matsumotoEmpalme;
  const R = encuadrar(e[2]);
  const dLon = (X_VIA * MAPA_POR_UNIDAD / R) / Math.cos(e[1] * RAD) / RAD;
  return [e[0] - dLon, e[1], R];
}
const V_EMPALME = vistaEmpalme();

/* 🚦 LA VELOCIDAD DE CRUCERO CON FRENADA, y esto es una curva y no un `suave`.
   Un `suave` arranca despacio, acelera y frena: eso es lo que hace una cosa que
   se mueve de un sitio a otro, no lo que hace un tren en marcha. Un tren ya
   viene lanzado —la vía entra a toda velocidad—, se mantiene, y frena al final.

   Así que: lineal hasta `desde`, y de ahí una parábola que llega a velocidad
   cero justo al final. Las dos mitades casan en la misma pendiente, que es lo
   que hace que no se note el cambio. Devuelve de 0 a 1, normalizado, para que
   `LARGO` siga siendo lo que de verdad recorre. */
function crucero(t, desde) {
  const rec = t <= desde
    ? t
    : desde + (t - desde) - ((t - desde) * (t - desde)) / (2 * (1 - desde));
  return rec / ((1 + desde) / 2);
}

/* --------------------------------------------------------------------------
   La escena que se hereda del acto 6
   --------------------------------------------------------------------------
   🚨 ESTO NO SE HEREDA: SE PINTA, EN CADA FOTOGRAMA DE ESTE ACTO.
   Bajando a mano desde el acto 6 ya está todo puesto y esta función no cambia
   nada. Saltando desde el raíl —desde el vuelo, por ejemplo— no hay nada:
   `apagarDibujo()` ya ha corrido, el suelo está arriba, los árboles están todos
   encendidos, la escena está a su tamaño y no hay ni coche ni castillo. El acto
   que te saltas no pinta, no sale y no deja nada preparado (ley 20).

   Son CINCO cosas y las cinco están aquí, que es una más que en el acto 6: el
   zoom, el suelo bajado, los árboles apagados, las piezas y la nevada.
   Lo barato es escribir cinco números; lo caro es el fallo.
   -------------------------------------------------------------------------- */
let sueloRel = 0.68;      /* se lee de --suelo al preparar el acto */
let bandaAltoPx = 0;      /* y de --banda-alto, por lo mismo */

function escenaHeredada() {
  /* 🚨 LO QUE ESTE ACTO ENSEÑA, DICHO EN POSITIVO (ley 23). El motor apaga todo
     lo demás, exista o no hoy. Las cinco primeras son del acto 6 —se van en la
     primera pantalla, pero tienen que estar— y las cinco últimas son las suyas:
     el acto 8 podrá estrenar su pagoda sin tocar una línea de este archivo. */
  limpiarPiezas('coche', 'matsumoto', 'sierra', 'sierra-lejos', 'pico',
                'via-izq', 'via-der', 'tren-shinano', 'tren-shinkansen', 'anden');
  variable('--halo', 0);
  variable('--luces', 0);
  variable('--puertas', 0);
  /* La línea del suelo la trae la banda, igual que en los actos 4, 5 y 6 */
  variable('--op-suelo', 0);
  /* 🚨 LOS ÁRBOLES SIGUEN APAGADOS, que es como los dejó el acto 6, y esto hay
     que escribirlo aunque el valor sea cero: es la ley 26, y la primera vez que
     apareció —el bosque pelado al volver hacia atrás— la avisó Kiko antes de
     que se escribiera una línea de código. */
  variable('--mezcla', 0);
  nieveHastaElSuelo(1);
}

export function montarActoTren() {
  return registrarActo({
    id: 'tren',
    el: document.getElementById('tren'),

    preparar() {
      /* Dónde está la línea del suelo y lo alto que es el paisaje, leídos UNA
         vez de donde viven, que es base.css. getComputedStyle es caro: por eso
         se hace aquí y no en cada fotograma, igual que en los actos 4, 5 y 6.
         🚨 El alto de la banda hace falta para calcular hasta dónde hay que
         hundir el paisaje para que salga ENTERO de la pantalla: escrito a ojo,
         el día que el bosque cambie de alto se quedaría una franja de copas
         asomando por el canto de abajo. */
      const capa = document.getElementById('dibujo');
      if (!capa) return;
      const cs = getComputedStyle(capa);
      const leido = parseFloat(cs.getPropertyValue('--suelo'));
      sueloRel = isNaN(leido) ? 0.68 : leido / 100;
      const n = parseFloat(cs.getPropertyValue('--banda-alto').trim());
      bandaAltoPx = isNaN(n) ? 0 : n * Math.min(window.innerWidth, window.innerHeight) / 100;
    },

    /* 🚨 AL SALIR, SE RECOGE (ley 12) — Y ESTE ACTO RECOGE MENOS QUE EL 6, QUE
       ES LA SEÑAL DE QUE LA LEY 23 ESTÁ BIEN DADA LA VUELTA.

       La primera versión devolvía aquí las cinco cosas de capas compartidas que
       este acto toca: el suelo hundido, los árboles, el zoom, la nevada y las
       piezas. Y estaba MAL, y lo cazó `inspeccionar-escena.js` en el salto del
       acto 7 al 3: «el SUELO sigue bajado (270.1)».

       🚨 EL MOTIVO ES EL ORDEN, y conviene no olvidarlo porque no se ve leyendo
       este archivo. En cada fotograma el motor recorre los actos EN ORDEN: el 3
       pinta —y deja el suelo arriba, que es lo suyo— y DESPUÉS el 7, que acaba
       de salir de su tramo, ejecuta su `salir()` y lo vuelve a bajar. El acto
       que se va pisa al que acaba de pintar, y como el motor no repinta el mismo
       fotograma dos veces (`ultimo`), el destrozo se queda hasta que muevas el
       scroll.

       Y no hacía ninguna falta: **los siete actos escriben esas cuatro cosas en
       cada fotograma suyo** —es la ley 26— así que el acto al que saltas ya las
       deja como quiere. Lo mismo vale para las piezas: cada acto declara las
       SUYAS y el motor apaga el resto (ley 23).

       Aquí solo queda lo que de verdad es de este acto y nadie más toca: sus
       rótulos, el mapa —que además hay que devolver a su tamaño (ley 16)— y el
       grosor de la línea de la vía, que este acto engorda hasta convertirla en
       la vía del tren y que ningún otro sabe que existe. */
    salir(acto) {
      acto.v('--p-viaje-1', 0);
      acto.v('--p-viaje-2', 0);
      acto.v('--p-total', 0);
      mostrarLienzo(false);
      limpiarRutas(0);
      empequeñecerMapa(0);
      engordarVias(1.2);
    },

    pintar(p, acto) {
      mostrarDibujo(true);

      const altoPantalla = window.innerHeight;
      const unidad = Math.min(window.innerWidth, altoPantalla) / 100;
      /* 🚨 LO ALTO QUE ES LA PANTALLA, EN UNIDADES. Es el número del que cuelga
         todo este acto: 216 en un móvil de 390×844 y 100 en un portátil de
         1440×900. Lo que tenga que entrar desde abajo o salir por arriba se
         calcula con esto, nunca con un número escrito a mano (ley 27). */
      const altoU = altoPantalla / unidad;
      const bordeU = (window.innerWidth / unidad) / 2;

      escenaHeredada();

      /* ================================================================
         A · SE VA LA NIEVE
         ================================================================
         El acto 6 acaba con el coche rodando hacia la izquierda sobre la
         carretera nevada. Lo primero que pasa aquí es que ese viaje TERMINA:
         hemos llegado a la estación de Matsumoto, el coche se va —se devuelve
         ahí, que es donde se devuelve también el material de esquí— y con él se
         va el decorado entero.

         🚨 Y SE VA MOVIÉNDOSE, NO POR OPACIDAD. «En esta película las cosas
         llegan, no aparecen», y al revés igual: el mundo sigue corriendo hacia
         la derecha como al final del acto 6, así que el castillo y los Alpes
         salen por la derecha y el coche por la izquierda. */
      const salida = suave(tramo(p, F.salida[0], F.salida[1]));

      desplazarFondo(FONDO_AL_FINAL_6 - SALIDA_FONDO * salida);
      const arrastre = 1.182 * SALIDA_FONDO * salida;

      /* 🚨 EL PAISAJE SE HUNDE, Y ESTO ES LO QUE HACE QUE LA CÁMARA SUBA.
         No es un fundido ni un apagado: la línea del suelo baja hasta que la
         banda entera —manto de nieve y carretera— queda por debajo del canto de
         abajo de la pantalla. Lo que se lee es que nos elevamos, y es lo que
         justifica que lo siguiente se vea desde arriba.

         🚨 Y HASTA DÓNDE HAY QUE HUNDIRLA SE CALCULA, PORQUE DEPENDE DEL ZOOM.
         La capa está encogida al 0,60 desde el centro de la pantalla, así que
         su canto de abajo no cae en el borde: cae al 80 % de la altura. Un
         punto de la capa a la altura Y se ve en alto/2 + (Y - alto/2) × zoom,
         de donde sale que para que el suelo salga por debajo del borde hace
         falta Y = alto/2 + (alto/2)/zoom, y todavía un alto de banda más para
         que las copas no se queden asomando. */
      const zoomVuelta = mezcla(ZOOM_FIN, 1, suave(tramo(p, F.zoomVuelve[0], F.zoomVuelve[1])));
      const zoomAhora = mezcla(zoomVuelta, ZOOM_FUERA,
        suave(tramo(p, F.zoomFuera[0], F.zoomFuera[1])));
      const bajaQuieto = altoPantalla * (1 - sueloRel);
      const bajaFuera = altoPantalla / 2 + (altoPantalla / 2) / ZOOM_FIN
        + bandaAltoPx - sueloRel * altoPantalla;
      const hundido = suave(tramo(p, F.hunde[0], F.hunde[1]));
      bajarSuelo(mezcla(bajaQuieto, bajaFuera, hundido));
      zoomEscena(zoomAhora);

      /* La banda solo mientras se ve: cuando ya se ha hundido del todo, se
         apaga entera (ley 14, y son cuatrocientos nodos). */
      const hayPaisaje = hundido < 0.999;
      verBanda('ciudad', 0);
      verBanda('bosque', 0);
      verBanda('bosque-nevado', hayPaisaje ? 1 : 0);

      /* 🚨 Y DEJA DE NEVAR, que es lo único que este acto apaga por desvanecido
         y tiene por qué: la nieve no es un dibujo que se pueda mover, es el
         tiempo que hace. Lleva cayendo desde el acto 3 —«empieza a nevar»— y
         aquí se sale de la montaña hacia Kioto. NORMAS § 9 ya decía que este
         acto es «blanco otra vez». */
      nevar(1 - suave(tramo(p, F.deja[0], F.deja[1])));

      /* --- Las piezas que deja puestas el acto 6 -----------------------
         🚨 SUS SITIOS SE CALCULAN, NO SE COPIAN. El castillo pesa en el borde
         izquierdo y la montaña grande llega al derecho, y los dos dependen del
         zoom y del ancho de la pantalla: es la lección que costó un hueco de
         papel en la cuarta ronda del acto 6. */
      const bordeZoom = bordeU / zoomAhora;
      const xPico = bordeZoom - PICO_ANCHO_U / 2 + arrastre;
      colocar('pico', { x: xPico, y: 0, op: xPico < bordeZoom + PICO_ANCHO_U ? 1 : 0, escala: 1 });

      const xSierra = arrastre;
      const vista1 = xSierra < bordeZoom + 190 ? 1 : 0;
      colocar('sierra', { x: xSierra, y: 0, op: vista1, escala: 1 });
      colocar('sierra-lejos', { x: xSierra * 0.62, y: 0, op: vista1, escala: 1 });

      const xCastillo = -bordeZoom + CASTILLO_ANCHO_U / 2 + arrastre;
      colocar('matsumoto', {
        x: xCastillo,
        y: 0,
        op: xCastillo < bordeZoom + CASTILLO_ANCHO_U ? 1 : 0,
        escala: 1
      });

      /* 🚗 Y EL COCHE SE VA POR LA IZQUIERDA, que es hacia donde iba.
         Sale del todo —se calcula con el borde, no se manda a un número lejano
         (ley 27)— y ahí se acaba el coche de alquiler, que se devuelve en
         Matsumoto igual que el material de esquí. */
      const fueraCoche = bordeZoom + ANCHO_COCHE_U;
      const xCoche = -fueraCoche * salida;
      colocar('coche', {
        x: xCoche,
        y: 0,
        op: xCoche > -(bordeZoom + ANCHO_COCHE_U / 2) ? 1 : 0,
        escala: 1
      });

      /* ================================================================
         A.bis · EL MAPA CRECE, ENTRA EN LA ESTACIÓN Y ENTREGA LA VÍA
         ================================================================
         «Cuando lleguemos a Matsumoto, se hace zoom hacia la estación», y en la
         primera ronda Kiko pidió lo que le faltaba: «al igual que antes pasaba
         en Tokio, tienen que aparecer las calles, y hasta tal punto en el que se
         amplía el punto donde está la estación de Matsumoto, donde se coge el
         tren, y **sea el propio trazo de la línea de las vías lo que acaba
         siendo la vía donde está el tren**».

         Así que son DOS paradas de cámara y no una, igual que el acto 3 sobre
         Shinjuku: primero la ciudad —donde entran las calles— y después la
         estación, donde entra la línea del ferrocarril y engorda hasta que el
         dibujo la recoge. Las dos se solapan: si crece y luego se acerca, son
         dos movimientos; solapadas, es una cámara que entra. */
      const opMapa = 0.92 * (1 - suave(tramo(p, F.mapaSeVa[0], F.mapaSeVa[1])));
      const opKioto = 0.92 * suave(tramo(p, F.mapaEntra[0], F.mapaEntra[1]));
      const enKioto = opKioto > 0.004;
      const opTotal = enKioto ? opKioto : opMapa;

      if (opTotal > 0.004) {
        mostrarLienzo(true);
        alzarLienzo(1);
        opacidadMapa(opTotal);
        if (enKioto) {
          /* E · KIOTO. La cámara se echa atrás desde la estación hasta que cabe
             la región entera: las dos costas —el mar de Japón al norte y la
             bahía de Osaka al sur— que es lo que sitúa la ciudad.
             🚨 Y A PANTALLA COMPLETA, que es como lo necesita el acto 8. */
          empequeñecerMapa(0);
          viajarDeVista(V_KIOTO_CERCA, V_KIOTO, suave(tramo(p, F.mapaKioto[0], F.mapaKioto[1])));
          pintarMapa();
          marcar('kioto', LUGARES.kioto, 1);
          limpiarHitos('kioto');
          cerrarHalo('kioto', suave(tramo(p, F.mapaEntra[0], F.mapaEntra[1])));
          limpiarRutas(0);
        } else {
          /* A · MATSUMOTO, en dos paradas */
          empequeñecerMapa(1 - suave(tramo(p, F.mapaCrece[0], F.mapaCrece[1])));
          const tEstacion = suave(tramo(p, F.zoomEstacion[0], F.zoomEstacion[1]));
          if (tEstacion > 0) {
            viajarDeVista(V_CALLE, V_EMPALME, tEstacion);
          } else {
            viajarDeVista(V_MATSUMOTO, V_CALLE, suave(tramo(p, F.zoomCiudad[0], F.zoomCiudad[1])));
          }
          pintarMapa();

          /* 🚨 LA RUTA Y LAS ETIQUETAS SE VAN ANTES DE ENTRAR EN LA ESTACIÓN.
             Vienen del acto 6 —es el fotograma del que arranca este (ley 5)— y
             a escala de ciudad ya no dicen nada: la carretera se convierte en
             una raya que cruza la pantalla y la etiqueta de Matsumoto se planta
             encima de la estación justo cuando hay que mirarla. */
          const seVanLosDatos = suave(tramo(p, F.zoomCiudad[0], F.zoomCiudad[1]));
          const opRuta = 1 - seVanLosDatos;
          marcar('yamanouchi', LUGARES.yamanouchi,
            1 - suave(tramo(p, F.hitoYamanouchi[0], F.hitoYamanouchi[1])));
          marcar('matsumoto', LUGARES.matsumoto, opRuta);
          limpiarHitos('yamanouchi', 'matsumoto');
          pintarRuta(0, RUTA_MATSUMOTO, 1,
            { color: 'var(--acento)', guion: false, opacidad: opRuta });
          cerrarHalo('matsumoto', 1);
          limpiarRutas(1);

          /* 🚨 Y LA LÍNEA DE LA VÍA ENGORDA HASTA SER LA VÍA.
             De un pelo al ancho del balasto de la vía dibujada —que son 30
             unidades del escenario, o sea 78 del mapa—. A este zoom las cuatro
             vías del haz de la estación caen a menos de quince unidades unas de
             otras, así que al engordar se funden en una sola banda: **esa banda
             es la que el dibujo recoge**. Ver engordarVias() en lienzo.js. */
          /* 🔁 Y no llega al ancho entero del balasto, sino a algo menos: a este
             zoom hay cuatro vias paralelas en el haz de la estacion, y si cada
             una engorda hasta 78 unidades lo que queda no es una via, es una
             pared. Con 62 se funden en una banda del ancho de la via dibujada
             y todavia se les nota que son varias. */
          engordarVias(mezcla(1.2, ANCHO_VIA_U * MAPA_POR_UNIDAD * 0.8,
            suave(tramo(p, F.viasEngordan[0], F.viasEngordan[1]))));
        }
      } else {
        /* 🚨 Y AL APAGARLO, DEVOLVERLO A SU TAMAÑO (ley 16). Aquí el mapa se
           apaga Y VUELVE dentro del mismo acto —una vez en Matsumoto y otra en
           Kioto—, así que sin esto el acto 8 se lo encontraría encogido. */
        mostrarLienzo(false);
        limpiarRutas(0);
        empequeñecerMapa(0);
      }

      /* ================================================================
         EL MUNDO, QUE CORRE HACIA ARRIBA PORQUE EL VIAJE BAJA
         ================================================================
         🚨 ESTE SIGNO ES LA CORRECCIÓN MÁS IMPORTANTE DE LA PRIMERA RONDA.
         Kiko: «tendría que continuar para abajo, porque al final es un viaje
         unidireccional en una dirección». El tren no se puede mover —ocupa la
         pantalla de canto a canto—, así que lo que dice hacia dónde va es el
         suelo: si el mundo corre hacia ARRIBA, el tren baja. Y baja también por
         el mapa, que es de donde venía la intuición: Matsumoto está al norte y
         Kioto al sur.

         Los dos tramos se suman en el mismo número y no pueden pisarse: el
         primero acaba en 0,600 y el segundo no empieza hasta 0,742, y en medio
         está el transbordo, con la vía parada. */
      const rec1 = LARGO_1 * crucero(tramo(p, F.tramo1[0], F.tramo1[1]), 0.78);
      const rec2 = LARGO_2 * crucero(tramo(p, F.tramo2[0], F.tramo2[1]), 0.76);

      /* 🚨 Y AL FINAL LA VÍA SE HUNDE POR DONDE VINO. Es la rima del acto: la
         cámara subió al principio dejando el paisaje de la nieve abajo, y sube
         otra vez al final dejando la vía. Así el dibujo desaparece MOVIÉNDOSE,
         que es la regla, y «solo queda el mapa de Kioto», que es el guion. */
      const hundeVia = suave(tramo(p, F.hundeVia[0], F.hundeVia[1])) * (altoU + ALTO_VIA + 40);

      /* Dónde se para un tren: con el morro unas unidades por encima del canto
         de abajo. La pieza se coloca por su borde de ARRIBA, así que hay que
         restarle lo que mide (ley 27: se calcula con la pantalla). */
      const yTrenParado = altoU - MARGEN_MORRO - ALTO_TREN;

      /* ================================================================
         B · LA VÍA DE LA DERECHA · la que entrega el mapa
         ================================================================
         🚨 NO LLEGA: LA ENTREGA EL MAPA. Es lo que pidió Kiko, y es la única
         cosa de todo el dibujo que entra por opacidad con permiso: no está
         apareciendo de la nada, está recogiendo un trazo que ya estaba en
         pantalla, en el mismo sitio y con el mismo ancho. El mapa se disuelve
         encima mientras tanto. */
      const empalme = suave(tramo(p, F.empalme[0], F.empalme[1]));
      const yendose1 = suave(tramo(p, F.seVa1[0], F.seVa1[1]));
      /* 🚨 SE VA HACIA ABAJO, que es la otra mitad de la corrección: «es la de
         la derecha la que baja hasta abajo». */
      const bajaDer = yendose1 * (altoU + ALTO_VIA + 60);
      const yViaDer = Y_VIA - (rec1 % PERIODO_VIA) + bajaDer;
      colocar('via-der', {
        x: X_VIA,
        y: yViaDer,
        op: (empalme > 0.004 && yViaDer < altoU) ? empalme : 0,
        escala: 1
      });

      /* --- El primer tren: el Limited Express Shinano -------------------
         🚨 LLEGA DESDE ARRIBA, QUE ES DE DONDE VENIMOS. Estamos parados en el
         andén de Matsumoto —la cámara acaba de meterse ahí— y el tren entra en
         la estación frenando. Con el viaje bajando por la pantalla, un tren que
         entra en una estación entra por arriba; las estaciones, en cambio, nos
         vienen de frente, porque los que nos movemos somos nosotros. */
      const tLlega = frena(tramo(p, F.trenLlega[0], F.trenLlega[1]));
      const yTren1 = mezcla(yTrenParado - (altoU + ALTO_TREN), yTrenParado, tLlega)
        + yendose1 * (altoU + ALTO_TREN + 80);
      colocar('tren-shinano', {
        x: X_VIA,
        y: yTren1,
        op: (tLlega > 0 && yTren1 < altoU && yTren1 > -(ALTO_TREN + 20)) ? 1 : 0,
        escala: 1
      });

      /* ================================================================
         C · LA ESTACIÓN DE NAGOYA · y esto lo cambió Kiko entero
         ================================================================
         «El intercambio se tiene que hacer en una estación de tren», y «la vía
         del otro tren no tiene que venir junto desde abajo; sí tiene que venir
         desde abajo, pero **tiene que estar junto a la estación**».

         🚨 ASÍ QUE LA ESTACIÓN ES UN BLOQUE: el andén, la vía de la izquierda y
         el shinkansen ya esperando en ella. Las tres cosas llegan JUNTAS y de
         frente mientras todavía nos movemos —porque los que nos movemos somos
         nosotros—, frenan con la vía y se paran. Cuando llega el transbordo, ahí
         no se mueve nada: «debería parecer que está estática».

         🚨 Y SU SITIO NO ES UNA VENTANA DE SCROLL: ES LA DISTANCIA QUE FALTA.
         Sale de restar lo recorrido a lo que mide el tramo, así que frena
         exactamente como frena la vía porque las dos cosas salen del mismo
         número. Es la misma idea que el mono bajando por el perfil medido de su
         montaña: una sola fuente. */
      const faltaNagoya = Math.max(0, LARGO_1 - rec1);

      /* La vía de la izquierda: llega con la estación y, a partir del
         transbordo, es la nuestra y hace bucle con el segundo tramo. */
      const yViaIzq = Y_VIA + faltaNagoya - (rec2 % PERIODO_VIA) + hundeVia;
      colocar('via-izq', {
        x: -X_VIA,
        y: yViaIzq,
        op: yViaIzq < altoU ? 1 : 0,
        escala: 1
      });

      /* --- El segundo tren: el shinkansen, esperando en su andén ---------
         🚨 Y NO «APARECE»: ESTÁ. Llega con la estación, de frente, y se queda.
         Kiko: «se pone en paralelo con un tren igual» — y el 18 de septiembre
         eligió cómo: *mismo tamaño, morro distinto*. Las dos barras miden lo
         mismo y sus divisiones de coche caen en los mismos sitios, así que el
         paralelo se lee como un espejo; lo único que cambia es la punta, que es
         lo que distingue un limited express de un shinkansen desde arriba. */
      const yTren2 = yTrenParado + faltaNagoya + hundeVia;
      colocar('tren-shinkansen', {
        x: -X_VIA,
        y: yTren2,
        op: yTren2 < altoU ? 1 : 0,
        escala: 1
      });

      /* --- El andén, que sirve a las DOS estaciones ----------------------
         🚨 Nunca están las dos en pantalla: cuando el de Kioto asoma por abajo,
         el de Nagoya lleva mil unidades por encima del canto de arriba. Así que
         es la misma pieza, en dos sitios del mundo y en dos momentos.
         En Nagoya va en el CENTRO —es un andén de isla, con una vía a cada
         lado— y en Kioto a la IZQUIERDA, pegado a la única vía que queda. */
      const yAndenNagoya = Y_ANDEN + faltaNagoya - rec2;
      const yAndenKioto = Y_ANDEN + (LARGO_2 - rec2) + hundeVia;
      const enKiotoAnden = yAndenKioto < altoU;
      const yAnden = enKiotoAnden ? yAndenKioto : yAndenNagoya;
      colocar('anden', {
        x: enKiotoAnden ? X_ANDEN_KIOTO : X_ANDEN_NAGOYA,
        y: yAnden,
        op: (yAnden < altoU && yAnden > -(ALTO_ANDEN + 20)) ? 1 : 0,
        escala: 1
      });

      /* ================================================================
         EL TEXTO
         ================================================================
         🚨 LOS DATOS VAN ENFRENTE DEL TREN Y CAMBIAN DE LADO EN EL TRANSBORDO,
         que es literal: primero a la izquierda, «y los otros datos aparecen en
         el lado de la derecha». Los dos tramos están verificados —ver
         investigacion/021 § 3— así que aquí no hay placeholder: lo que falta de
         este acto son los horarios exactos de diciembre, que no salen hasta
         noviembre, y eso va marcado en el HTML. */
      acto.v('--p-viaje-1',
        suave(tramo(p, F.viaje1Dent[0], F.viaje1Dent[1])) *
        (1 - suave(tramo(p, F.viaje1Fuer[0], F.viaje1Fuer[1]))));

      /* 🚨 Y LOS DOS SE VAN ANTES DE QUE ENTRE EL MAPA, con la misma ventana:
         son la misma columna de texto y se retiran juntos. */
      const datosSeVan = 1 - suave(tramo(p, F.datosFuer[0], F.datosFuer[1]));
      acto.v('--p-viaje-2',
        suave(tramo(p, F.viaje2Dent[0], F.viaje2Dent[1])) * datosSeVan);
      acto.v('--p-total', suave(tramo(p, F.total[0], F.total[1])) * datosSeVan);
    }
  });
}
