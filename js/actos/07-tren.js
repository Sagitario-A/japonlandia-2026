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

   🚨 ESTE ACTO CAMBIA EL PUNTO DE VISTA, y es el único de los ocho que lo hace.
   Los seis anteriores se miran de lado y todo se apoya en la línea del suelo.
   Aquí se mira desde arriba. El acto entero está construido sobre esa idea:
   **la cámara sube** al empezar —el paisaje de la nieve se hunde por debajo del
   canto de abajo— y **vuelve a subir** al acabar, cuando la vía se va por donde
   vino y deja el mapa de Kioto. Lo de en medio pasa visto desde el aire.

   🚨 Y EL TREN NO SE MUEVE: SE MUEVE LA VÍA. Es el truco del coche del acto 3
   girado noventa grados, y aquí es obligatorio, no una opción: el tren cruza la
   pantalla de canto a canto, así que moverlo sería sacarlo de cuadro. Lo que
   corre es el suelo, igual que corría el bosque.

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

import { registrarActo } from '../motor/escenario.js?v=fd6072d8';
import { tramo, suave, tope, frena, mezcla } from '../motor/util.js?v=fd6072d8';
import { encuadrar, viajarDeVista } from '../motor/proyeccion.js?v=fd6072d8';
import { pintarMapa, pintarRuta, limpiarRutas, marcar, mostrarLienzo, opacidadMapa, cerrarHalo, alzarLienzo, empequeñecerMapa, limpiarHitos } from '../motor/lienzo.js?v=fd6072d8';
import { mostrarDibujo, colocar, variable, verBanda, desplazarFondo, bajarSuelo, limpiarPiezas, zoomEscena } from '../motor/dibujo.js?v=fd6072d8';
import { nevar, nieveHastaElSuelo } from '../motor/nieve.js?v=fd6072d8';
import { tenderRuta } from '../motor/ruta.js?v=fd6072d8';
import { LUGARES, RUTA_A_MATSUMOTO, ENCUADRES } from '../datos/rutas.js?v=fd6072d8';
/* 🚨 LO ÚNICO QUE ESTE ACTO IMPORTA DE OTRO, y es a propósito, igual que el
   acto 6 importa cinco números del 5: son el fotograma del que arranca (ley 5).
   Escritos a mano aquí serían el mismo número en dos archivos —regla 1 del
   repositorio— y el día que alguien mueva el zoom del acto 6 o el ancho del
   castillo, este acto abriría con las cosas en otro sitio. */
import { ZOOM_FIN, PICO_ANCHO_U, CASTILLO_ANCHO_U, FONDO_AL_FINAL_6 } from './06-yamanouchi.js?v=fd6072d8';

function vista(clave) {
  const e = ENCUADRES[clave];
  return [e[0], e[1], encuadrar(e[2])];
}

/* Los tres encuadres del acto: de donde lo deja el 6, la estación de Matsumoto
   —adonde se hace el zoom— y Kioto, que es donde acaba. */
const V_MATSUMOTO = vista('matsumoto');
const V_ESTACION = vista('matsumotoEstacion');
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
   🚨 EL ACTO MIDE 1.700 svh: diecisiete pantallas. NORMAS § 9 le había
   presupuestado 700 antes de construirlo, y la historia de los cuatro actos
   anteriores es que el presupuesto siempre se queda corto: el 3 pasó de 1.300 a
   2.400, el 4 de 800 a 1.100, el 5 de 700 a 1.000 y el 6 de 800 a 1.900.
   Kiko: «el largo lo eliges tú y lo ajustas mirándolo en pantalla; prefiero que
   cada golpe respire».

   Y aquí hay un motivo de más: **esto es un viaje de tres horas**. Los actos de
   coche cuentan el viaje con el mapa y el paisaje corriendo por detrás; este lo
   cuenta con una vía que pasa, y una vía que pasa necesita sitio para que se
   lea como un trayecto largo y no como un apeadero.

   El reparto, en pantallas de las diecisiete:
     la estación        2,9   se va el coche, se hunde el paisaje y el mapa
                              crece, hace zoom sobre la estación y se disuelve
     el trayecto        5,0   llegan la vía y el tren, corre la vía, y a la
                              izquierda se cuenta el tramo hasta Nagoya
     el transbordo      3,1   el segundo tren sube por la izquierda y el
                              primero se va hacia arriba
     el segundo tramo   3,9   corre otra vez, más deprisa, y llega el andén
     Kioto              2,2   zoom out, se hunde la vía y aparece el mapa

   (suman más de diecisiete porque las ventanas SE SOLAPAN a propósito: una cosa
   entra mientras la anterior se está yendo)
   -------------------------------------------------------------------------- */
const F = {
  /* A · la estación.
     🚨 EL ORDEN DE ESTAS CINCO VENTANAS ES LA ESCENA. Primero se va el coche
     —que es lo último que hacía el acto 6—, después deja de nevar, después se
     hunde el paisaje, y solo cuando ya no queda nada abajo vuelve el zoom a su
     tamaño. Si el zoom volviera antes, se vería la escena entera crecer con las
     montañas todavía puestas, que es un movimiento que nadie ha pedido. */
  salida: [0.010, 0.140],
  deja: [0.020, 0.140],
  hunde: [0.048, 0.145],
  /* 🚨 Y EL ZOOM VUELVE A 1 CON LA PANTALLA YA VACÍA. Es la ley 26 con la
     variable que estrenó el acto 6: alguien tiene que devolverla, y aquí se
     devuelve en el único momento en que no se ve.
     🚨 Y TIENE QUE ACABAR ANTES DE QUE LLEGUE EL TREN, no solaparse con él: el
     zoom vive en la capa del dibujo, o sea que mientras corre le cambia el
     tamaño a TODO lo que haya dentro. Con las dos ventanas solapadas, el tren
     entraba creciendo del 60 % al 100 % mientras subía, y eso no es llegar: es
     que te lo acerquen. Las dos casan en el mismo número —0,172—, que es la
     lección que costó el golpe de la roca del acto 5. */
  zoomVuelve: [0.148, 0.172],

  /* El mapa: crece a pantalla completa, hace zoom sobre la estación y se
     disuelve, que es exactamente lo que hace el acto 3 con el mapa de Tokio. */
  mapaCrece: [0.020, 0.115],
  mapaZoom: [0.020, 0.205],
  mapaSeVa: [0.085, 0.178],
  hitoYamanouchi: [0.022, 0.078],

  /* B · el trayecto.
     🚨 LA VÍA Y EL TREN LLEGAN JUNTOS Y DESDE ABAJO, no aparecen. Es la regla
     del acto 6 —«en esta película las cosas llegan»— y aquí además resuelve un
     problema: una banda infinita no puede entrar andando, así que entra como lo
     que es, un trozo de mundo que sube desde debajo del borde de abajo. Lo
     mismo que hizo el onsen del acto 5. */
  /* 🚨 Y EMPIEZA A LLEGAR MIENTRAS EL MAPA TODAVÍA SE ESTÁ YENDO. Se vio en la
     tabla de opacidades: con la vía entrando después del mapa quedaban casi
     siete décimas de pantalla con la página EN BLANCO, sin mapa y sin tren, y
     eso no es una pausa, es un agujero. En esta película una cosa entra
     mientras la otra se va — es lo mismo que hacen las autopistas con la costa
     en el acto 3. */
  llega: [0.172, 0.252],
  /* El primer tramo: Matsumoto → Nagoya. La vía corre a velocidad de crucero y
     frena al final, que es lo que hace un tren que entra en una estación. */
  tramo1: [0.200, 0.468],
  viaje1Dent: [0.250, 0.300],
  viaje1Fuer: [0.430, 0.470],

  /* C · el transbordo, en Nagoya.
     🚨 Y AQUÍ NO SE MUEVE NADA MÁS: la vía está parada. Es lo mismo que pidió
     Kiko para el acto 6 —«toda la imagen estática hasta que ya el coche
     acelere»— y aquí sale solo, porque un transbordo ES una parada. */
  sube2: [0.480, 0.562],
  seVa1: [0.578, 0.652],
  /* 🚨 Y EL DATO DEL SEGUNDO TRAMO ENTRA CUANDO LA DERECHA YA ESTÁ LIMPIA, no
     antes: el tren de la derecha se lleva su vía al irse, y hasta que no ha
     salido del todo ese lado es un dibujo y no un sitio donde escribir. */
  viaje2Dent: [0.648, 0.700],

  /* D · el segundo tramo: Nagoya → Kioto, 35 minutos para 135 km. Va MUCHO más
     deprisa que el primero y esa diferencia es el dato: son los mismos golpes
     de vía pasando al doble y medio de ritmo. */
  tramo2: [0.640, 0.872],
  total: [0.790, 0.840],
  /* 🚨 Y LOS DOS DATOS SE VAN ANTES DE QUE ENTRE EL MAPA DE KIOTO. Se vio en la
     captura: con el tren hundiéndose y el mapa apareciendo, el rótulo del
     segundo tramo se quedaba encima de los dos y no se leía ninguno de los
     tres. El final es «hasta que solo queda el mapa de Kioto», y solo quiere
     decir solo. */
  datosFuer: [0.864, 0.906],

  /* E · Kioto.
     🚨 EL FINAL RIMA CON EL PRINCIPIO: el acto empieza hundiendo el paisaje de
     la nieve para subir al aire, y acaba hundiendo la vía por el mismo sitio.
     Es la única forma de que el dibujo desaparezca MOVIÉNDOSE —el fundido es
     para el mapa y el texto— y de que «solo quede el mapa de Kioto». */
  zoomFuera: [0.872, 0.962],
  hundeVia: [0.884, 0.986],
  mapaKioto: [0.872, 1.000],
  mapaEntra: [0.888, 0.976]
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

/* 🚨 EL PERÍODO DE LA VÍA, Y ESTE NÚMERO VIVE EN DOS SITIOS.
   arte/via.svg repite su dibujo cada 100 unidades de un viewBox de 1200, y la
   pieza mide 360u de alto: 100 × 360 / 1200 = 30u por período. Es lo que
   permite que el desplazamiento dé la vuelta sin que se vea la costura, igual
   que las copias de la banda del bosque del acto 3.
   ⚠️ Si alguien cambia el ritmo de las traviesas o de los postes en el dibujo,
   este número hay que cambiarlo aquí. Va avisado en la cabecera del .svg. */
const PERIODO_VIA = 30;

/* Dónde se planta la vía cuando ya ha llegado: un período por encima del borde
   de arriba, para que al dar la vuelta el bucle nunca enseñe su canto. */
const Y_VIA = -PERIODO_VIA;

/* 🚨 EL MORRO TIENE QUE VERSE, Y POR ESO EL TREN NO EMPIEZA EN EL CANTO.
   Kiko eligió el 18 de septiembre dibujar los dos trenes del mismo tamaño y con
   el morro distinto, y esa diferencia solo cuenta si el morro está dentro de la
   pantalla. Ocho unidades por debajo del borde de arriba bastan para que se lea
   la punta y el cuerpo siga yéndose por abajo, que es lo que pidió: «de arriba
   hasta abajo, como una barra». */
const Y_TREN = 8;

/* Lo que recorre la vía en cada tramo, en unidades.
   🚨 LA PROPORCIÓN ENTRE LOS DOS ES EL DATO, y por eso no son dos números
   redondos cualesquiera: el Shinano tarda dos horas en 188 km y el shinkansen
   treinta y cinco minutos en 135. Aquí el segundo tramo pasa 1.150 unidades de
   vía en menos scroll que las 700 del primero, o sea a dos veces y media su
   ritmo. Eso es lo único que dice «hemos cambiado a un tren rápido» sin
   escribirlo en ningún sitio.
   💭 Y no más: con la vía a más ritmo, un scroll rápido empieza a solapar las
   traviesas —que van cada 15u— y el dibujo parpadea. Es el mismo techo que
   tiene la nevada del acto 3, y se mide mirando, no calculando. */
const LARGO_1 = 700;
const LARGO_2 = 1150;

/* Dónde para el andén de Kioto: al lado del tren que sigue.
   🚨 PEGADO A ÉL Y NO EN EL CENTRO DE LA PANTALLA, y hay dos motivos. El
   primero es que un tren para PEGADO al andén —con un hueco en medio no es una
   estación, son dos cosas sueltas—. El segundo se vio en la captura: centrado,
   la losa se comía el sitio donde va el texto del segundo tramo y no se leía ni
   una cosa ni la otra. El tren va en -26 y mide 24, o sea que su costado
   derecho cae en -14; el andén mide 20, así que en -3 queda a una unidad de él
   y deja la derecha libre de +7 en adelante. */
const X_ANDEN = -3;
const Y_ANDEN = 22;

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
      const banda = cs.getPropertyValue('--banda-alto').trim();
      /* Viene en vmin, que es la unidad de esta capa */
      const n = parseFloat(banda);
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
       cada fotograma suyo** —es la ley 26, y está así desde que Kiko la avisó
       antes de construir el acto 6—, así que el acto al que saltas ya las deja
       como quiere. Lo mismo vale para las piezas: cada acto declara las SUYAS y
       el motor apaga el resto (ley 23), o sea que los trenes se apagan solos en
       cuanto pinta cualquier otro acto.

       Aquí solo queda lo que de verdad es de este acto y nadie más toca: sus
       rótulos y el mapa, que además hay que devolver a su tamaño (ley 16).

       Saliendo por abajo NO se apaga nada: ahí el dibujo entero se va cayendo
       poco a poco (principal.js), y cortarlo de golpe es justo lo que Kiko no
       quería: «de repente desaparece y tarda un rato en llegar lo otro». */
    salir(acto) {
      acto.v('--p-viaje-1', 0);
      acto.v('--p-viaje-2', 0);
      acto.v('--p-total', 0);
      mostrarLienzo(false);
      limpiarRutas(0);
      empequeñecerMapa(0);
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

      /* El fondo sigue desde donde lo dejó el acto 6 y en el mismo sentido:
         hacia la derecha, porque vamos al oeste. */
      desplazarFondo(FONDO_AL_FINAL_6 - SALIDA_FONDO * salida);
      /* Y lo que está plantado en el suelo se va con el suelo, que es la misma
         regla del final del acto 6. 1,182 unidades por punto de --fondo es lo
         que mide una copia de banda entre 100. */
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
         que las copas no se queden asomando.
         Escrito a mano, esto se rompía el día que alguien tocara el zoom del
         acto 6 o el alto del bosque. Ya costó dos fallos en el acto 6. */
      /* 🚨 UNA SOLA ESCRITURA DEL ZOOM POR FOTOGRAMA, y por eso los dos
         movimientos —el que lo devuelve a 1 al principio y el que se aleja al
         final— se resuelven en el mismo número antes de escribirlo. Con dos
         llamadas, en el tramo final se escribía el `transform` de la capa dos
         veces por fotograma para dejarlo en un solo sitio. */
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
         papel en la cuarta ronda del acto 6. Aquí se repite la misma cuenta con
         el zoom de AHORA, que además está cambiando. */
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
         No se queda con el resto del decorado: el decorado lo arrastra el suelo
         y el coche va por su pie. Sale del todo —se calcula con el borde, no se
         manda a un número lejano (ley 27)— y ahí se acaba el coche de alquiler,
         que se devuelve en Matsumoto. */
      const fueraCoche = bordeZoom + ANCHO_COCHE_U;
      const xCoche = -fueraCoche * salida;
      colocar('coche', {
        x: xCoche,
        y: 0,
        op: xCoche > -(bordeZoom + ANCHO_COCHE_U / 2) ? 1 : 0,
        escala: 1
      });

      /* ================================================================
         A.bis · EL MAPA CRECE, HACE ZOOM SOBRE LA ESTACIÓN Y SE DISUELVE
         ================================================================
         «Cuando lleguemos a Matsumoto, se hace zoom hacia la estación.»

         Es el mismo gesto del acto 3 con el mapa de Tokio —zoom hasta que el
         mapa se disuelve y detrás queda el dibujo—, con una diferencia: aquí el
         mapa llega ENCOGIDO, porque el acto 6 lo deja en su ventana de arriba.
         Así que primero vuelve a su tamaño y después hace el zoom. Las dos
         cosas se solapan a propósito: si crece y luego se acerca, son dos
         movimientos; solapadas, es una cámara que entra.

         🚨 Y NO HAY RELEVO QUE PREPARAR, al revés que en el acto 3. Allí el
         callejero tenía que entrar antes de que la costa se fuera, porque el
         mapa seguía después; aquí el mapa se está yendo, así que quedarse sin
         nada que dibujar es exactamente lo que toca. Comprobado en pantalla a
         390 y a 1440: la red de autopistas se enciende a mitad de este zoom y
         NO se le ve el canto de su caja —que se acaba en 137,56, o sea a un
         suspiro de Matsumoto— porque al oeste de la ciudad no hay autopistas
         que dibujar: están los Alpes. */
      /* El mapa de Matsumoto llega ENCENDIDO —el acto 6 lo deja al 0,92— y lo
         único que hace aquí es irse mientras la cámara entra. */
      const opMapa = 0.92 * (1 - suave(tramo(p, F.mapaSeVa[0], F.mapaSeVa[1])));

      /* El mapa de Kioto del final, que entra por opacidad — el fundido es para
         el mapa y el texto (regla del acto 6) */
      const opKioto = 0.92 * suave(tramo(p, F.mapaEntra[0], F.mapaEntra[1]));
      const enKioto = opKioto > 0.004;
      const opTotal = enKioto ? opKioto : opMapa;

      if (opTotal > 0.004) {
        mostrarLienzo(true);
        alzarLienzo(1);
        opacidadMapa(opTotal);
        if (enKioto) {
          /* E · KIOTO. La cámara se echa atrás desde la estación hasta que cabe
             la región entera: el lago Biwa, la bahía de Osaka y la de Ise, que
             es lo que hace reconocible Kioto de un vistazo.
             🚨 Y A PANTALLA COMPLETA, que es como lo necesita el acto 8. */
          empequeñecerMapa(0);
          viajarDeVista(V_KIOTO_CERCA, V_KIOTO, suave(tramo(p, F.mapaKioto[0], F.mapaKioto[1])));
          pintarMapa();
          marcar('kioto', LUGARES.kioto, 1);
          limpiarHitos('kioto');
          cerrarHalo('kioto', suave(tramo(p, F.mapaEntra[0], F.mapaEntra[1])));
          limpiarRutas(0);
        } else {
          /* A · MATSUMOTO. Crece y entra hacia la estación, con la ruta del
             acto 6 todavía puesta: es el fotograma del que arranca (ley 5). */
          empequeñecerMapa(1 - suave(tramo(p, F.mapaCrece[0], F.mapaCrece[1])));
          viajarDeVista(V_MATSUMOTO, V_ESTACION, suave(tramo(p, F.mapaZoom[0], F.mapaZoom[1])));
          pintarMapa();
          /* 🚨 YAMANOUCHI SE APAGA EN CUANTO LA CÁMARA SE MUEVE, y es la ley
             22: su etiqueta son once letras, y al cerrarse el encuadre sobre
             Matsumoto el punto se va hacia el borde derecho y se leía «YAMANO».
             Se vio en la captura, no en el código. Está ahí por la costura —el
             acto 6 lo deja encendido— y se va en cuanto deja de hacer falta. */
          marcar('yamanouchi', LUGARES.yamanouchi,
            1 - suave(tramo(p, F.hitoYamanouchi[0], F.hitoYamanouchi[1])));
          marcar('matsumoto', LUGARES.matsumoto, 1);
          limpiarHitos('yamanouchi', 'matsumoto');
          pintarRuta(0, RUTA_MATSUMOTO, 1, { color: 'var(--acento)', guion: false });
          cerrarHalo('matsumoto', 1);
          limpiarRutas(1);
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
         B · LA VÍA Y EL TREN LLEGAN, Y DESDE ABAJO
         ================================================================
         🚨 UNA BANDA INFINITA NO PUEDE ENTRAR ANDANDO, así que entra como lo
         que es: un trozo de mundo que sube desde debajo del borde de abajo.
         Es lo mismo que hizo el onsen del acto 5 —«aparece como por abajo, de
         esto que sube»— y lo que hace que esto no sea un fundido.

         Y llegan las DOS vías, no una. Kiko: «dejando el hueco de la izquierda
         como si tuviese que ver un tren también, pero no lo hay». 💭 Se ha
         leído así: el hueco tiene VÍA pero no tiene tren, que es lo que hace
         que el hueco se lea como una promesa en vez de como un descuido — y lo
         que hace que el segundo tren tenga dónde llegar en el transbordo. */
      /* 🚨 Y LLEGA UNA SOLA VÍA, LA DE LA DERECHA. La primera versión ponía las
         dos desde el principio, y en la primera captura se vio por qué está
         mal: «en el lado izquierdo va apareciendo la duración y demás del
         trayecto», o sea que la izquierda es donde se escribe — y el texto
         salía impreso encima de las traviesas, ilegible.
         Así que **cada tren trae su vía y se la lleva al irse**: mientras hay
         un tren solo, el otro lado es papel en blanco. Que es exactamente lo
         que dijo Kiko: «como si tuviese que ver un tren también, pero no lo
         hay». No lo hay, y tampoco su vía. */
      const llegando = frena(tramo(p, F.llega[0], F.llega[1]));

      /* Lo que lleva recorrido la vía, que es lo único que se mueve en todo el
         trayecto. Los dos tramos se suman en el mismo número y no pueden
         pisarse: el primero acaba en 0,468 y el segundo no empieza hasta 0,640,
         y en medio está el transbordo, con la vía parada. */
      const recorrido =
        LARGO_1 * crucero(tramo(p, F.tramo1[0], F.tramo1[1]), 0.80) +
        LARGO_2 * crucero(tramo(p, F.tramo2[0], F.tramo2[1]), 0.78);

      /* 🚨 Y AL FINAL LA VÍA SE HUNDE POR DONDE VINO. Es la rima del acto: la
         cámara subió al principio dejando el paisaje de la nieve abajo, y sube
         otra vez al final dejando la vía. Así el dibujo desaparece MOVIÉNDOSE,
         que es la regla, y «solo queda el mapa de Kioto», que es el guion. */
      const hundeVia = suave(tramo(p, F.hundeVia[0], F.hundeVia[1])) * (altoU + 380);

      /* El bucle: lo que lleva recorrido, dado la vuelta en un período exacto.
         Como el dibujo se repite igual, la vuelta no se ve. */
      const bucle = recorrido % PERIODO_VIA;
      const yendose1 = suave(tramo(p, F.seVa1[0], F.seVa1[1]));
      const subiendo2 = frena(tramo(p, F.sube2[0], F.sube2[1]));

      /* 🚨 LO QUE YA SE HA IDO, NO VUELVE. Este es un fallo que se vio en la
         captura del final y que no se ve leyendo el código: el hundido del
         final baja TODO lo que hay en la capa, y el Shinano —que se había ido
         hacia arriba en el transbordo— volvía a entrar por el canto de arriba
         justo cuando aparecía el mapa de Kioto. Un tren que ya no está en la
         película no se hunde con el mundo: no está. */
      const seFue1 = yendose1 >= 0.999;

      /* La vía de la derecha llega con el Shinano y se va con él, hacia arriba.
         Mide 360u, así que para salir del todo por el canto de arriba tiene que
         subir más que eso: se calcula con el alto de la pantalla, no con un
         número a ojo (ley 27). */
      const yViaDer = mezcla(altoU + 20, Y_VIA, llegando)
        - yendose1 * (altoU + 420) + bucle + (seFue1 ? 0 : hundeVia);
      colocar('via-der', {
        x: X_VIA,
        y: yViaDer,
        op: (!seFue1 && yViaDer < altoU && yViaDer > -390) ? 1 : 0,
        escala: 1
      });

      /* Y la de la izquierda llega con el shinkansen, en el transbordo */
      const yViaIzq = mezcla(altoU + 20, Y_VIA, subiendo2) + bucle + hundeVia;
      colocar('via-izq', {
        x: -X_VIA,
        y: yViaIzq,
        op: (subiendo2 > 0 && yViaIzq < altoU) ? 1 : 0,
        escala: 1
      });

      /* --- El primer tren: el Limited Express Shinano -------------------
         Llega con su vía y se queda. A partir de ahí no se mueve hasta el
         transbordo, donde «se sube hacia arriba» y se va. */
      const yTren1 = mezcla(altoU + 40, Y_TREN, llegando)
        - yendose1 * (altoU + 340) + (seFue1 ? 0 : hundeVia);
      colocar('tren-shinano', {
        x: X_VIA,
        y: yTren1,
        op: (!seFue1 && yTren1 < altoU && yTren1 > -320) ? 1 : 0,
        escala: 1
      });

      /* --- C · EL SEGUNDO TREN, QUE SUBE POR LA IZQUIERDA ---------------
         «Se pone en paralelo con un tren igual, pero en el lado izquierdo, que
         aparece desde abajo.»

         🚨 Y NO ES IGUAL, Y ESO LO DECIDIÓ KIKO: *mismo tamaño, morro
         distinto*. Las dos barras miden lo mismo y sus divisiones de coche caen
         en los mismos sitios, así que el paralelo se sigue leyendo como un
         espejo; lo único que cambia es la punta, que es lo que distingue un
         limited express de un shinkansen cuando se miran desde arriba.
         Ver arte/tren-shinkansen.svg. */
      const yTren2 = mezcla(altoU + 40, Y_TREN, subiendo2) + hundeVia;
      colocar('tren-shinkansen', {
        x: -X_VIA,
        y: yTren2,
        op: (subiendo2 > 0 && yTren2 < altoU) ? 1 : 0,
        escala: 1
      });

      /* --- D · EL ANDÉN, QUE LLEGA PORQUE LLEGAMOS NOSOTROS -------------
         «Llega a una estación.»

         🚨 SU SITIO NO ES UNA VENTANA DE SCROLL: ES LA DISTANCIA QUE FALTA.
         El andén está plantado al final del segundo tramo, así que su altura
         sale de restar lo recorrido a lo que mide el tramo. Con eso frena
         exactamente como frena la vía —las dos cosas salen del mismo número— y
         no hay forma de que una se pare antes que la otra. Es la misma idea que
         el mono bajando por el perfil medido de su montaña: una sola fuente.  */
      const yAnden = Y_ANDEN + (LARGO_2 - LARGO_2 * crucero(tramo(p, F.tramo2[0], F.tramo2[1]), 0.78))
        + hundeVia;
      colocar('anden', {
        x: X_ANDEN,
        y: yAnden,
        op: yAnden < altoU ? 1 : 0,
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
