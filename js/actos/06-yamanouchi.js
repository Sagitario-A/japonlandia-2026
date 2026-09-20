/* =============================================================================
   actos/06-yamanouchi.js · El mono, la huida y la salida de la nieve
   -----------------------------------------------------------------------------
   Guion literal → web-nueva/DEFINICION.md, acto A6. En orden:

     A · EL MAPA      el muñeco sigue en el onsen y vuelve el mapa con la ruta
                      en coche hasta el tercer sitio
     B · LOS DATOS    los del tercer alojamiento, arriba
     C · EL MONO      «aparece por la derecha un mono de la nieve, de estos
                      japoneses de Nagano, de Jigokudani, y avanza ligeramente
                      hacia la izquierda sin llegar al onsen»
     D · EL SUSTO     «el muñeco lo ve, se asusta, sale hacia la izquierda
                      corriendo» — y de paso RECOGE LA TABLA que se dejó tirada
                      en Kusatsu
     E · SE VAN       «deja el onsen y el mono, que se van hacia la derecha»
     F · EL COCHE     «por la izquierda aparece otra vez el mismo coche; el
                      muñeco se mete dentro, que no hace falta animación,
                      simplemente cuando llega al coche desaparece»
     G · MATSUMOTO    «el coche se queda ahí abajo haciendo como una animación
                      de moverse, como la de cuando veníamos, pero sin bosque ni
                      nada», mientras se completa la ruta hasta la estación

   🚨 CÓMO SE VA EL BOSQUE, QUE ERA EL ÚNICO NUDO DEL ACTO, Y LO RESOLVIÓ KIKO.
   El guion pide que el coche ruede «sin bosque ni nada», y el bosque lleva
   puesto desde el acto 3. Se le enseñaron tres salidas —desvanecerlo quieto,
   deslizarlo a la derecha con el mono y el onsen, o subir el paisaje otra vez a
   su línea de siempre— y dio una cuarta, que es mejor que las tres y que además
   ya estaba construida:

     «Se apagan LOS ÁRBOLES, uno a uno, y la nieve se queda. Los nueve árboles
      de bosque-nevado.svg ya son ranuras numeradas gobernadas por --mezcla, y
      el manto de nieve y la línea de la carretera están FUERA de esas ranuras.
      Bajando --mezcla hasta 0 se apagan los árboles por orden —número a número,
      que es como los repartí para que no pareciera una persiana— y queda la
      carretera nevada. Es literalmente “sin bosque” y NO me quedo sin suelo.
      Es el relevo casa-árbol del acto 3 corriendo al revés.»

   Y resuelve solo lo que parecía el otro problema del final: el manto sigue
   desplazándose con la banda, así que **el coche sigue rodando sin inventar
   nada**. (La propuesta que había sobre la mesa —girarle las llantas— era
   además falsa: las ruedas del coche son dos círculos concéntricos con el mismo
   centro, y un círculo girando sobre su centro no se ve moverse. Lo cazó él.)

   🚨 DÓNDE EMPIEZA (ley 5). En el fotograma EXACTO en que acaba el acto 5:
   muñeco metido en el onsen y relajado, con el agua por media espalda y la
   POSTURA DEL ONSEN puesta; el onsen centrado; la roca parada a la derecha del
   medio; la tabla tumbada en la nieve a la izquierda; bosque nevado detrás,
   nevando fuerte, sin mapa y sin datos.

   🚨 Y NADA DE ESO SE HEREDA SOLO: SE PINTA. Saltando desde el raíl al acto 6
   desde el acto 1, `apagarDibujo()` ya ha corrido y ahí no hay ni onsen, ni
   muñeco, ni roca, ni tabla, ni suelo bajado, ni árboles. Este acto tiene que
   pintar la escena heredada ENTERA en cada fotograma suyo, igual que el acto 5
   repite el bloque del 4 y el 4 repite el del 3. Son cuatro cosas y las cuatro
   están juntas, en `escenaHeredada()`, para que no se pierda ninguna:
     · el suelo bajado (--baja-px), que el acto 3 devuelve a cero en cuanto pinta
     · la POSTURA del muñeco, que los actos 3 y 4 ponen en la de tabla
     · los ÁRBOLES (--mezcla), que solo escribían el acto 3 y ahora el 4 y el 5
     · el onsen, la roca y la tabla, que son piezas de una capa compartida

   🚨 LAS POSICIONES VAN EN UNIDADES DEL ESCENARIO, que mide 100u de ancho —de
   -50 a +50—. La explicación larga está en css/actos/03-al-coche.css § 1.
   La excepción es la `y` del muñeco y de la tabla, que va EN PÍXELES: se la
   quedaron así del acto 4.
   ============================================================================= */

import { registrarActo } from '../motor/escenario.js?v=a3f6e416';
import { tramo, suave, tope, frena, mezcla } from '../motor/util.js?v=a3f6e416';
import { encuadrar, viajarDeVista } from '../motor/proyeccion.js?v=a3f6e416';
import { pintarMapa, pintarRuta, limpiarRutas, marcar, mostrarLienzo, opacidadMapa, cerrarHalo, alzarLienzo, empequeñecerMapa, limpiarHitos } from '../motor/lienzo.js?v=a3f6e416';
import { mostrarDibujo, colocar, variable, verBanda, desplazarFondo, bajarSuelo, limpiarPiezas, postura, zoomEscena, perfilDe, altura } from '../motor/dibujo.js?v=a3f6e416';
import { nevar, nieveHastaElSuelo } from '../motor/nieve.js?v=a3f6e416';
import { tenderRuta } from '../motor/ruta.js?v=a3f6e416';
import { LUGARES, RUTA_A_YAMANOUCHI, RUTA_A_MATSUMOTO, ENCUADRES } from '../datos/rutas.js?v=a3f6e416';
/* 🚨 LO ÚNICO QUE ESTE ACTO IMPORTA DE OTRO ACTO, y es a propósito: son los
   cuatro números con los que acaba el acto 5, o sea el fotograma del que este
   arranca (ley 5). Escritos a mano aquí serían el mismo número en dos archivos
   —regla 1 del repositorio—, y el día que alguien mueva la tabla o cambie lo
   ancho del onsen, el acto 6 abriría con las cosas en otro sitio que el 5. */
import { HUNDIDO_U, ONSEN_ANCHO_U, X_TABLA_CAE, X_ROCA_PARA, FONDO_AL_FINAL } from './05-kusatsu.js?v=a3f6e416';

function vista(clave) {
  const e = ENCUADRES[clave];
  return [e[0], e[1], encuadrar(e[2])];
}

/* Las dos rutas, tendidas una sola vez al cargar. Las dos son carretera de
   verdad de OpenStreetMap; la primera además tiene un puerto cerrado vetado a
   mano en el buscador. Ver datos/carretera-yamanouchi.js, que lo cuenta entero. */
const RUTA_1 = tenderRuta(RUTA_A_YAMANOUCHI, 0.2);
const RUTA_2 = tenderRuta(RUTA_A_MATSUMOTO, 0.2);

/* 🚨 UN ENCUADRE POR TRAMO, y no uno para los dos. Es la lección que Kiko dio
   en el acto 3 —«al final no hace falta abarcar tanto»— y que se volvió a
   aprender sola en el acto 5. Con un encuadre que abarcara Kusatsu, Yamanouchi
   y Matsumoto, el primer tramo volvía a ser un rasguño en una esquina. */
const V_YAMANOUCHI = vista('yamanouchi');
const V_MATSUMOTO = vista('matsumoto');

/* --------------------------------------------------------------------------
   El reparto del scroll
   --------------------------------------------------------------------------
   🚨 EL ACTO MIDE 1.600 svh: dieciséis pantallas, el segundo más largo de los
   seis. Kiko: «el largo lo eliges tú; prefiero que cada golpe respire a que el
   acto sea corto». NORMAS § 9 le había presupuestado 800 antes de construirlo,
   y la historia de los tres actos anteriores es que el presupuesto siempre se
   queda corto: el 3 pasó de 1.300 a 2.400, el 4 de 800 a 1.100 y el 5 de 700 a
   1.000. Este tiene SIETE golpes y dos mapas con su ruta; el 5 tenía cinco
   golpes y un mapa en nueve pantallas.

   El reparto, en pantallas de las dieciséis que dura:
     el mapa y la ruta   4,2   vuelve el mapa y se dibuja la carretera larga
     los datos           3,4   el panel del tercer alojamiento
     el mono             1,8   entra por la derecha y se para sin llegar
     el susto y la huida 2,4   se levanta del agua, corre y recoge la tabla
     se van              1,5   el onsen y el mono, hacia la derecha
     el coche            1,7   entra por la izquierda y él desaparece dentro
     el final            3,4   se apagan los árboles y se traza Matsumoto

   (suman más de dieciséis porque las ventanas SE SOLAPAN a propósito: una cosa
   entra mientras la anterior se está yendo)
   -------------------------------------------------------------------------- */
const F = {
  /* A · el mapa y la ruta.
     🚨 EL MAPA ENTRA YA EN SU SITIO, solo por opacidad, como en el acto 5: lo
     pidió Kiko en la tercera ronda del acto 3, «que se empiece a aparecer ya
     directamente en la posición en la que está». */
  mapaEntra:  [0.012, 0.065],
  ruta1:      [0.070, 0.215],
  viaje1Dent: [0.095, 0.150],
  viaje1Fuer: [0.225, 0.272],
  mapa1SeVa:  [0.228, 0.280],

  /* 🚨 Y MIENTRAS LA RUTA SE DIBUJA, EL PAISAJE CORRE. Kiko, primera ronda:
     «cuando aparece el mapa de Kusatsu a Yamanouchi y se va completando la
     ruta, el onsen con el muñeco se tiene que quedar en el centro estático,
     pero la tabla y la roca y los árboles del fondo tienen que moverse a
     relativamente alta velocidad hacia la izquierda».

     Es el viaje contado con lo que ya hay: el muñeco no se mueve —está metido
     en el agua, y esa es la broma— y el mundo pasa por detrás. Cuando la línea
     llega a Yamanouchi, el mundo frena y **entra el hotel**.
     🚨 La curva es `frena`: arranca de golpe —que es lo que pidió, «relativamente
     alta velocidad»— y se va posando. Al revés no serviría: el paisaje tiene
     que estar ya quieto cuando aparece el edificio. */
  corrida:    [0.052, 0.238],
  /* El hotel entra cuando la ruta ya ha llegado y el mundo casi se ha parado */
  entraHotel: [0.208, 0.268],

  /* B · los datos. Dos ventanas para el panel y no una, como en los actos 4 y
     5: --p-sube solo va hacia delante y --p-datos es lo que se ve, para que al
     final se desvanezca QUIETO en vez de irse por donde vino. */
  datosSube:  [0.268, 0.352],
  datosDent:  [0.268, 0.330],
  datosFuer:  [0.428, 0.478],

  /* 🚨 C · EL ZOOM OUT, QUE ES LO QUE ABRE LA SEGUNDA MITAD DEL ACTO.
     Kiko, viendo el acto publicado: «cuando se esté acabando Yamanouchi, de la
     página de Yamanouchi donde están las fotos y demás, que se va
     desvaneciendo, la escena donde estamos debería hacer zoom out. Y aparecer a
     la izquierda el coche y a la derecha una especie de montaña».

     Empieza EXACTAMENTE cuando el panel se va, no después: las dos cosas son el
     mismo gesto —se acaba de contar el alojamiento y la cámara se echa atrás
     para enseñar dónde estamos—. Y lo que entra en ese hueco entra DENTRO de la
     misma ventana, para que la escena nueva no aparezca sobre una pantalla que
     ya se ha quedado quieta. */
  zoom:       [0.428, 0.532],
  entraPico:  [0.436, 0.528],
  entraPoza:  [0.458, 0.538],
  entraCoche: [0.462, 0.546],

  /* 🔁 EL MONO YA NO ENTRA POR LA DERECHA: YA ESTÁ AHÍ, DENTRO DEL AGUA.
     Lo cambió Kiko en la misma ronda: «que haya como una especie de mini onsen,
     típico de onsen de montaña donde están los monos estos que se bañan en la
     nieve, y que esté el mono ahí dentro del agua y que salte y baje hacia
     nosotros». O sea que el mono deja de ser algo que llega y pasa a ser algo
     que YA ESTABA y que de pronto se mueve — que da bastante más susto.
     El salto es un solo movimiento: sale del agua, crece y baja hacia delante. */
  /* 🔁 Y EL SALTO SE ALARGA, porque ahora el muneco reacciona A MITAD DE LA
     BAJADA en vez de al final. Kiko: «el muñeco se deberia asustar antes, ya
     segun esta a mitad de la ladera el mono… y luego, cuando el mono este casi
     abajo, el muñeco casi que esta en el coche». O sea que las dos cosas dejan
     de ir en fila y pasan a ir a la vez: es una persecucion, no dos turnos. */
  monoSalta:  [0.574, 0.706],

  /* D · el susto y la huida.
     🚨 TRES VENTANAS QUE SE RELEVAN EN EL MISMO NÚMERO, no solapadas. Es el
     fallo que costó el acto 5: la ventana de la embestida acababa un pelo
     DESPUÉS de que empezara la del vuelo, las dos mandaban sobre la misma
     coordenada y el muñeco despegaba sin haber llegado a la roca. Aquí el
     respingo, la salida del agua y la carrera mandan todos sobre su `y` o su
     `x`, así que casan exactos. */
  susto:      [0.616, 0.644],
  /* 🚨 LA SALIDA DEL AGUA Y LA CARRERA SE SOLAPAN A PROPÓSITO, y esto se vio en
     la captura: con la subida terminando antes de que empezara la carrera había
     medio golpe entero con el muñeco DE PIE DENTRO DEL ONSEN, tapado de cintura
     para abajo por la mitad de delante. En pantalla no parecía que estuviera
     saliendo: parecía que estaba agachado en la bañera.
     Y no choca con la ley 6: estas dos ventanas mandan sobre coordenadas
     DISTINTAS —una sobre la altura y otra sobre la posición—, que es justo
     cuando el solape es bueno. Lo que no puede solaparse son dos ventanas que
     manden sobre lo mismo, que es lo que costó el golpe de la roca del acto 5. */
  saleDelAgua:[0.644, 0.700],
  corre:      [0.660, 0.788],
  seMete:     [0.788, 0.802],

  /* 🔁 Y AQUÍ YA NO SE VA NADIE. En la primera versión el onsen y el mono se
     deslizaban hacia la derecha mientras él corría, que es lo que decía el
     guion original. Kiko lo cambió al ver el acto: «el personaje se asusta y se
     va hacia el coche, pero dejando el onsen y TODA LA IMAGEN ESTÁTICA hasta
     que ya el coche acelere».
     Así que entre que él se mete en el coche y que el coche arranca **no se
     mueve absolutamente nada**, y eso es una decisión de puesta en escena, no
     un descuido: el plano se queda quieto con el onsen vacío y el mono plantado
     delante, y lo siguiente que pasa es que el coche se va. */

  /* G · el coche arranca, y ESTE ES EL OTRO CAMBIO DE LA RONDA.
     «Que se vaya moviendo hacia la izquierda, no hacia la derecha. Bueno,
     primero hacia la derecha, como para quedarse en el medio, y luego del medio
     hacia la izquierda, porque además tiene sentido ya que de Yamanouchi a
     Matsumoto [se va] hacia la izquierda.»

     Son las dos cosas seguidas y significan cosas distintas:
       · `arranca`  el coche se DESPLAZA de donde recogió —la izquierda— hasta
                    el centro de la pantalla. Es recolocarse, no viajar.
       · `viaja`    desde el centro, el que se mueve es EL MUNDO, y hacia la
                    derecha, así que el coche se lee yendo hacia la IZQUIERDA.
                    Es el truco del acto 3 con el signo cambiado.
     🚨 Y el signo importa por lo que dice él: Matsumoto está al oeste de
     Yamanouchi, o sea a la izquierda en el mapa que se está dibujando justo
     encima. Con el coche yendo hacia la derecha, el dibujo y el mapa contaban
     viajes contrarios en la misma pantalla. */
  /* 🔁 EL COCHE YA NO SE MUEVE SOLO, Y ESO LO CORRIGIO KIKO: «en realidad se
     va toda la escena, como que toda la escena se va a la derecha dejando al
     coche en el medio, y el coche ya va directamente hacia la izquierda, no que
     el coche se mueva hacia la derecha». O sea que no hay ventana de arranque:
     hay UNA sola cosa moviendose —el mundo— y el coche va con el hasta que
     llega al centro, donde se queda. Se ve en el codigo del coche, mas abajo. */
  viaja:      [0.818, 1.000],

  /* 🚨 LOS ÁRBOLES SE APAGAN UNO A UNO, y esta ventana es la del acto entero
     que más despacio va a propósito: son nueve ranuras en pantalla y pico, o
     sea que cada árbol tiene su momento. Con la mitad de sitio se lee como un
     fundido, que es justo lo que Kiko NO quería. */
  pelaBosque: [0.850, 0.928],
  mapa2Entra: [0.862, 0.908],
  ruta2:      [0.910, 0.990],
  viaje2Dent: [0.918, 0.962],
  /* 🔁 Y SE DESVANECE AL FINAL, QUE ES LO QUE PEDÍA LA COSTURA CON EL ACTO 7.
     Hasta el 18 de septiembre este dato se quedaba encendido en el último
     fotograma del acto, y mientras el 6 era el último de la película no se
     notaba. Con el 7 detrás sí: en cuanto el scroll pasa la costura, el acto 6
     sale de su tramo, `salir()` pone la variable a cero y el rótulo DESAPARECÍA
     DE GOLPE. Se vio en la primera captura del acto 7, en su fotograma cero.
     Ahora se va como se van los datos en los actos 3, 4 y 5: desvaneciéndose
     quieto, y antes de llegar al final. */
  viaje2Fuer: [0.968, 0.998],

  /* 🏔️ Y EL FONDO DE MATSUMOTO. Kiko: «la montaña grande que hay al fondo se
     deberia quedar segun se va desplegando a Matsumoto, porque Matsumoto tiene
     vista de los Alpes japoneses… segun nos vamos desplazando en la ruta a
     Matsumoto, que vayan apareciendo mas montañas».
     Las dos filas de sierra entran POR LA DERECHA con el viaje, a velocidades
     distintas: la de delante mas deprisa que la de detras. Eso es paralaje, y
     es lo unico que hace que un fondo parezca profundo cuando se mueve. */
  sierras:    [0.826, 0.960],
  /* 🏯 Y el castillo, al llegar. Igual que el hotel: llega, no aparece. */
  /* 🔁 MAS TARDE. Kiko: «hazlo mas cuando ya estemos llegando a Matsumoto». La
     ventana empieza ahora cuando la linea del mapa ya lleva mas de media ruta
     dibujada, no al principio del tramo: llegar es llegar. */
  castillo:   [0.944, 0.988]
};

/* --------------------------------------------------------------------------
   Dónde para cada cosa
   -------------------------------------------------------------------------- */
/* 🚨 LA COMPOSICIÓN QUE DEJA EL ZOOM OUT, Y POR QUÉ HAY NÚMEROS MAYORES DE 50.
   Con la escena encogida a ZOOM_FIN, un móvil deja de medir 100 unidades de
   ancho y pasa a medir 100 / 0,74 ≈ 135 —de −67 a +67—. Todo lo de aquí abajo
   está colocado dentro de ESE encuadre: a tamaño natural estaría fuera de la
   pantalla, y con el zoom puesto está dentro. */

/* 🚨 HASTA DÓNDE SE ENCOGE, Y POR QUÉ NO MÁS. La banda del bosque son tres
   copias en fila dentro de una caja con `overflow: hidden`, y al encoger la
   capa esa caja encoge con ella: pasado cierto punto el bosque deja de llegar a
   los bordes y sale el papel en blanco por los lados. La caja se ensanchó 40
   unidades por lado para este acto (ver 03-al-coche.css) y con eso aguanta
   hasta aquí. Para bajar más haría falta una CUARTA copia de banda, que es
   justo lo que se quitó del acto 3 para que fuera a 60 fps. */
export const ZOOM_FIN = 0.60;

/* La montaña, a la derecha. Kiko: «que empiece en la base y el pico se corte
   justo en el lateral derecho». El pico está dibujado en el borde derecho de su
   caja, así que basta con poner ese borde en el borde de la pantalla: la caja
   mide 96u y el borde derecho de un móvil con el zoom puesto cae en +67, o sea
   que su centro va en 67 − 48 ≈ 20.
   📐 En un portátil se ve algo de cielo a la derecha del pico: la unidad es
   `vmin` y la pantalla mide 160 unidades en vez de 100. Se compone para el
   móvil, que es la prioridad (NORMAS § 1). */
/* 🔁 LA MONTAÑA GRANDE YA NO TIENE SITIO FIJO: SE CALCULA.
   Su pico esta dibujado en el borde derecho de su caja, asi que para que caiga
   en el borde de la pantalla basta con poner su costado derecho ahi. Y donde
   esta el borde depende del ZOOM y del ancho de la pantalla, no de un numero:
   escrito a mano para el zoom de la ronda anterior, al alejar la camara se
   quedo corto y dejo un hueco de papel entre la montaña y el canto. Lo vio
   Kiko. Lo unico que hace falta escribir es lo ancha que es la pieza. */
export const PICO_ANCHO_U = 96;

/* La poza de los monos, al pie de la montaña. Va entre la roca que dejó el acto
   5 —en +25 y 16u de ancho, o sea que llega hasta +33— y el borde derecho. */
const MONTE_MONO_ANCHO_U = 56;
/* 🔁 Corrido a la derecha y encogido al verlo en pantalla: con 62 unidades en
   el 38 se salia por el borde derecho y ademas se comia el ala derecha del
   hotel. Asi cabe entera y deja ver el edificio. */
const X_MONTE_MONO = 66;
/* 🚨 DONDE CAE LA POZA EN LA CIMA, y sale del dibujo y no de un numero a ojo:
   el repecho llano de arte/monte-mono.svg va de x=204 a x=320 de un viewBox de
   400, o sea que su centro esta al 65,5 % del ancho de la pieza.
   🔁 La cima se corrio a la derecha del dibujo en la segunda ronda: la montaña
   se ve solo hasta poco mas de la mitad —«desde donde empieza por la izquierda
   hasta la mitad»— y con la cima en el centro del dibujo, el charco caia justo
   en el borde de la pantalla. */
const POZA_EN_CIMA = 0.655;
const X_POZA = X_MONTE_MONO + (POZA_EN_CIMA - 0.5) * MONTE_MONO_ANCHO_U;

/* 🐒 EL MONO ESTÁ LEJOS, Y POR ESO ES PEQUEÑO. Es lo único que da profundidad
   en una película sin sombras ni degradados: metido en la poza, al pie de la
   montaña, va al 62 % de su tamaño, y cuando salta «hacia nosotros» crece hasta
   pasarse del natural. Ese cambio de tamaño ES el salto hacia delante: sin él,
   un bicho que baja por la pantalla solo parece que baja. */
const MONO_LEJOS = 0.50;
const MONO_CERCA = 1.05;

/* 🚨 LOS NÚMEROS QUE ESTÁN ESCRITOS EN DOS SITIOS, juntos y avisados como en el
   acto 5: son la costura entre este archivo, el CSS y los dibujos.
   De aquí sale UNA sola cuenta —cuánto se hunde el mono en la poza— y es la
   misma que hizo el acto 5 para el muñeco. Lo ancho de la poza lo escribe este
   acto y lo lee el CSS, y no al revés, porque la cuenta lo necesita: dos
   definiciones de la misma medida es como el mono acaba flotando por encima del
   agua. Lo ancho del mono lo declara css/actos/06-yamanouchi.css. */
const POZA_ANCHO_U = 17;
const MONO_ANCHO_U = 22;
/* Adónde cae: hacia el centro y hacia delante, pero NO encima del muñeco. Deja
   sitio para que se le vea entero y para que el muñeco salga por el otro lado. */
const X_MONO_CAE = 22;
/* Lo alto que salta antes de caer, en unidades */
const MONO_SALTO_U = 20;

/* Adónde corre el muñeco, y por qué justo ahí.
   🚨 PASA POR ENCIMA DE LA TABLA Y LA RECOGE. La tabla se quedó tumbada en la
   nieve en Kusatsu, en X_TABLA_CAE, y eso cae justo en su camino. Kiko:
   «el material se devuelve en Matsumoto, que es adonde va el coche: dejarla
   enterrada en Kusatsu es un cabo suelto que se ve. Sin agacharse: la coge al
   vuelo». Así que sigue corriendo ocho unidades más allá de ella, que es lo que
   hace que se le vea correr CON la tabla antes de desaparecer. Si el final de
   la carrera coincidiera con la tabla, la recogida y la desaparición pasarían
   en el mismo fotograma y no se vería ninguna de las dos. */
const X_CORRE_FIN = X_TABLA_CAE - 5;

/* 🔁 DÓNDE PARA EL COCHE, Y AHORA CABE ENTERO A LA IZQUIERDA.
   Kiko: «aparecer a la izquierda el coche y a la derecha una especie de
   montaña». Mide 46u —casi media pantalla a tamaño natural— y con el zoom
   puesto la pantalla mide 135, así que anclado en −42 ocupa de −65 a −19 y cabe
   entero con dos unidades de margen. En la primera versión, sin zoom, no cabía:
   se quedaba con el maletero cortado contra el borde. */
const X_COCHE_PARA = -56;
const X_COCHE_ENTRA = -130;

/* Cuánto mundo pasa mientras el coche viaja al final.
   🚨 EN NEGATIVO, Y ESO ES LO QUE HACE QUE VAYA HACIA LA IZQUIERDA.
   El acto 3 sumaba para que el fondo corriera hacia la izquierda y el coche se
   leyera yendo a la derecha; aquí se resta, el fondo corre hacia la derecha y el
   coche se lee yendo a la IZQUIERDA. Lo pidió Kiko con su motivo: «tiene
   sentido, ya que de Yamanouchi a Matsumoto [vamos] hacia la izquierda» — y es
   verdad, Matsumoto está al oeste, o sea a la izquierda del mapa que se está
   dibujando justo encima. Con el coche hacia la derecha, el dibujo y el mapa
   contaban viajes contrarios en la misma pantalla. */
const VIAJE = 560;

/* 🔁 Y CUÁNTO MUNDO PASA MIENTRAS SE DIBUJA LA RUTA A YAMANOUCHI.
   Kiko, primera ronda: «a relativamente alta velocidad hacia la izquierda».
   760 es más de lo que el coche recorre al final en un tramo más corto: es
   deliberado, porque aquí lo que se está contando son 136 km de carretera y
   dos horas y media de rodeo, y el paisaje tiene que pasar como pasa por la
   ventanilla. 🚨 Y en POSITIVO: el fondo corre hacia la izquierda, que es lo
   contrario que al final del acto. */
const CORRIDA = 760;

/* 🚨 DÓNDE SE QUEDA EL FONDO AL ACABAR ESTE ACTO, que es donde tiene que
   arrancar el 7. Se exporta por lo mismo que el acto 5 exporta el suyo: escrito
   a mano allí, el paisaje pegaría un salto en la costura el día que se tocara
   cualquiera de los tres números de los que sale. Con `corriendo` y `viajando`
   los dos a 1 —que es el último fotograma— la cuenta de `pintar` es esta.
   🚨 Y VA DESPUÉS DE `CORRIDA` A PROPÓSITO: con `const` no hay elevación, así
   que escrito más arriba el módulo revienta al cargarse. */
export const FONDO_AL_FINAL_6 = FONDO_AL_FINAL + CORRIDA - VIAJE;


/* 🔁 POR DONDE ENTRAN EL HOTEL Y LA MONTAÑA, Y POR QUE NO ES UN FUNDIDO.
   Kiko, segunda ronda: «el edificio aparece de la nada, como de desvanecido, y
   deberia venir por la derecha, junto con los arboles, hasta que se queda en el
   medio». Y de la montaña: «aparece como tambien de la nada, ya con el mono; y
   no, deberia aparecer naturalmente al hacer zoom out».

   Asi que las dos dejan de entrar por opacidad y entran ANDANDO: van colgadas
   de la misma curva que mueve los arboles —igual que la roca del acto 5—, o sea
   que comparten velocidad exacta con el bosque y frenan a la vez. Lo que entra
   con el mundo no «aparece»: llega.
   Estas son las unidades que recorren, y no son las del fondo: el fondo da la
   vuelta al llegar al ancho de una copia y estas no. */
const ENTRADA_HOTEL = 118;
const ENTRADA_MONTE = 96;

/* Dónde se planta el hotel al llegar. Centrado y un pelo a la derecha del
   onsen: el onsen del muñeco está en el 0 y mide 32u, el edificio mide 88, así
   que centrándolo exacto el muñeco le tapa justo la entrada — que es la parte
   que hay que ver. Cuatro unidades bastan para destaparla sin que parezca
   descuadrado. */
const X_HOTEL = 0;

/* 🏯 Donde se planta el castillo de Matsumoto. A la izquierda del medio: a la
   derecha estan los Alpes entrando, y la estampa de Matsumoto es el castillo
   con la cordillera detras y a un lado, no delante. */
/* 🔁 A la izquierda del todo, y no en -16: el coche se queda en el centro
   rodando, y el castillo se pinta DESPUES que el, asi que centrado se lo comia
   entero. Se vio en la captura. Aqui el coche queda a su derecha, delante, que
   ademas es la estampa: el castillo al fondo y nosotros llegando. */
/* 🔁 Y SU SITIO SE CALCULA, COMO EL DE LA MONTAÑA GRANDE. Kiko: «que en el lado
   izquierdo, pues al igual que la montaña grande, que sea así un poco más
   consistente». O sea, simetría: la montaña pesa en el borde derecho y el
   castillo pesa en el izquierdo. Y se calcula del zoom por la misma razón que
   ella —una posición que depende del encuadre escrita a mano se rompe en cuanto
   se mueve la cámara—, que ya costó un hueco de papel una vez. */
export const CASTILLO_ANCHO_U = 46;
const ENTRADA_CASTILLO = 160;

/* 🚨 CUÁNTOS ÁRBOLES HAY, Y POR QUÉ ESTE NÚMERO ESTÁ AQUÍ.
   Es RANURAS, de 03-al-coche.js: con --mezcla a 12 están los nueve árboles de
   bosque-nevado.svg encendidos, y bajándola se van apagando de uno en uno por
   su número de ranura. Los números están repartidos y NO ordenados de izquierda
   a derecha —0, 4, 2, 3, 8, 5, 7, 9, 11—, que es lo que hace que el bosque se
   despueble a manchas y no como una persiana bajando. Ese reparto es de Kiko y
   es la razón por la que esta salida funciona.
   ⚠️ Está escrito en dos sitios, aquí y en el acto 3. Va avisado porque no hay
   forma limpia de que un acto exporte una constante de maquetación a otro sin
   que el 3 dependa del 6; si alguien añade una ranura al dibujo, se tocan los
   dos. */
export const RANURAS = 12;

/* --------------------------------------------------------------------------
   La escena que se hereda del acto 5
   --------------------------------------------------------------------------
   🚨 ESTO NO SE HEREDA: SE PINTA, EN CADA FOTOGRAMA DE ESTE ACTO.
   Bajando a mano desde el acto 5 todo esto ya está puesto y esta función no
   cambia nada. Saltando desde el raíl —desde el acto 1, por ejemplo— no hay
   nada de nada: `apagarDibujo()` ya ha corrido, el suelo está arriba, la
   postura es la de tabla y los árboles están todos encendidos. El acto que te
   saltas no pinta, no sale y no deja nada preparado (ley 20).
   Lo barato es escribir cinco números; lo caro es el fallo.
   -------------------------------------------------------------------------- */
let sueloRel = 0.68;   /* se lee de --suelo al preparar el acto */

function escenaHeredada(altoPantalla) {
  /* 🚨 LO QUE ESTE ACTO ENSEÑA, DICHO EN POSITIVO (ley 23). El motor apaga todo
     lo demás, exista o no hoy: así el acto 7 podrá estrenar sus trenes sin
     tocar una línea de este archivo. */
  limpiarPiezas('monigote', 'tabla', 'roca', 'onsen', 'onsen-fondo',
                'mono', 'coche', 'pico', 'poza', 'poza-fondo',
                'yorozuya', 'monte-mono', 'sierra', 'sierra-lejos',
                'matsumoto');
  variable('--halo', 0);
  variable('--luces', 0);
  variable('--puertas', 0);
  /* La línea del suelo la trae la banda de bosque, igual que en los actos 4 y
     5: dos líneas a la vez se ven como un error de impresión. */
  variable('--op-suelo', 0);

  /* El suelo sigue abajo del todo. Con `transform` y no moviendo `top`: mover
     `top` es layout de los quinientos nodos de la capa en cada fotograma. */
  nieveHastaElSuelo(1);
  bajarSuelo(altoPantalla * (1 - sueloRel));

  /* El bosque nevado, y solo él */
  verBanda('ciudad', 0);
  verBanda('bosque', 0);
  verBanda('bosque-nevado', 1);

  /* «Y sigue nevando», que no ha parado desde el acto 3 */
  nevar(1);

  /* Y el onsen, que es lo ancho que lo dejó el acto 5. Lo lee su CSS. */
  variable('--onsen-ancho', ONSEN_ANCHO_U);
}

export function montarActoYamanouchi() {
  return registrarActo({
    id: 'yamanouchi',
    el: document.getElementById('yamanouchi'),

    preparar(acto) {
      /* Dónde está la línea del suelo, leída UNA vez de donde vive, que es
         base.css. getComputedStyle es caro: por eso se hace al preparar y no en
         cada fotograma. Lo mismo que hacen los actos 4 y 5. */
      const capa = document.getElementById('dibujo');
      const leido = capa ? parseFloat(getComputedStyle(capa).getPropertyValue('--suelo')) : NaN;
      sueloRel = isNaN(leido) ? 0.68 : leido / 100;
    },

    /* 🚨 AL SALIR, SE RECOGE (ley 12), y este acto tiene MÁS que recoger que
       ninguno porque es el último: el panel y los dos datos de tramo siempre;
       el mapa siempre y DEVUELTO A SU TAMAÑO (ley 16, que ya costó tres fallos);
       y saliendo POR ARRIBA, además, el mono, la postura de correr y los
       ÁRBOLES.

       🚨 LOS ÁRBOLES SON LA NOVEDAD, y es la trampa que avisó Kiko antes de que
       se escribiera una línea: --mezcla la escribía SOLO el acto 3, así que si
       este acto la baja a 0 y se vuelve hacia atrás, el bosque se queda PELADO
       en los actos 5 y 4 —manto de nieve y carretera, sin un árbol—, porque no
       la devuelve nadie. Se arregla por los dos lados: los actos 4 y 5 la
       escriben a tope en cada fotograma suyo, y este la devuelve al salir.

       Saliendo por abajo NO se apaga nada: ahí el dibujo entero se va cayendo
       poco a poco (principal.js), y cortarlo de golpe es justo lo que Kiko no
       quería: «de repente desaparece y tarda un rato en llegar lo otro».

       🚨 Y POR DÓNDE SE HA SALIDO SE LE PREGUNTA A LA PÁGINA (ley 17): saltando
       desde el raíl el acto sale de golpe sin pintar nada por el camino, así
       que el último `p` sigue siendo el de donde estabas. */
    salir(acto) {
      acto.v('--p-datos', 0);
      acto.v('--p-sube', 0);
      acto.v('--p-viaje-1', 0);
      acto.v('--p-viaje-2', 0);
      mostrarLienzo(false);
      limpiarRutas(0);
      empequeñecerMapa(0);
      if (acto.el.getBoundingClientRect().top > 0) {
        limpiarPiezas('monigote', 'tabla', 'roca', 'onsen', 'onsen-fondo');
        postura('monigote', 'onsen');
        variable('--mezcla', RANURAS);
        /* 🚨 Y LA ESCENA A SU TAMAÑO. El zoom vive en la capa compartida, igual
           que los árboles y el suelo: sin devolverlo, al subir al acto 5 el
           onsen y el muñeco salen encogidos y con una franja de papel en blanco
           por debajo del suelo. Es la ley 26 con la variable de este acto. */
        zoomEscena(1);
      }
    },

    pintar(p, acto) {
      mostrarDibujo(true);

      const altoPantalla = window.innerHeight;
      const unidad = Math.min(window.innerWidth, altoPantalla) / 100;

      escenaHeredada(altoPantalla);

      /* ================================================================
         G.bis · LOS ÁRBOLES
         ================================================================
         Va lo primero porque manda sobre el fondo entero y porque, mientras no
         le toca, su trabajo es sostener lo que dejó el acto 5: los nueve
         árboles puestos.

         «Se apagan los árboles, uno a uno, y la nieve se queda.» De 12 a 0: el
         de la ranura 11 primero, luego el 9, el 8… hasta el 0. El manto de
         nieve y la línea de la carretera están FUERA de las ranuras, así que se
         quedan — y como la banda sigue desplazándose con --fondo, el coche
         sigue rodando sin que haya que inventarle nada. */
      const pelado = suave(tramo(p, F.pelaBosque[0], F.pelaBosque[1]));
      variable('--mezcla', RANURAS * (1 - pelado));

      /* ================================================================
         C · EL ZOOM OUT
         ================================================================
         «Cuando se esté acabando Yamanouchi, la escena donde estamos debería
         hacer zoom out», para que quepan el coche a la izquierda y la montaña a
         la derecha.

         🚨 Y EL ORIGEN ESTÁ EN EL CENTRO DE LA PANTALLA, no en el suelo: es lo
         que hace que al encoger **la línea del suelo suba** y quede una franja
         de papel en blanco por delante. Sin esa franja, el mono no tiene adónde
         saltar cuando «baja hacia nosotros»: el suelo es el borde de abajo y
         por delante no hay nada. Ver zoomEscena() en motor/dibujo.js. */
      const zoom = mezcla(1, ZOOM_FIN, suave(tramo(p, F.zoom[0], F.zoom[1])));
      zoomEscena(zoom);

      /* 🚨 Y DE AQUÍ SALE CUÁNTO SITIO HAY POR DELANTE DEL SUELO, que es adonde
         cae el mono. Al encoger desde el centro, el borde de abajo de la capa
         —que es la línea del suelo en este acto— sube y deja libre media
         pantalla por la diferencia de escala. En coordenadas de la capa, esa
         franja mide esto. Se calcula, no se pone a ojo: depende del zoom y del
         alto de la pantalla, y en un móvil alto no es lo mismo que en un
         portátil. */
      const delanteU = ((1 / zoom) - 1) * altoPantalla / 2 / unidad;

      /* ================================================================
         EL MUNDO, QUE SE MUEVE DOS VECES Y EN SENTIDOS CONTRARIOS
         ================================================================
         🔁 LA PRIMERA ES NUEVA, de la primera ronda de Kiko: mientras el mapa
         dibuja la ruta de Kusatsu a Yamanouchi, «la tabla y la roca y los
         árboles del fondo tienen que moverse a relativamente alta velocidad
         hacia la izquierda», y el onsen con el muñeco se queda quieto en el
         centro. Es el viaje contado con lo que ya hay en pantalla: él no se
         mueve —está metido en el agua— y el mundo le pasa por detrás.

         La segunda es el final, y va al revés: el coche sale hacia el OESTE, o
         sea a la izquierda, así que el mundo corre hacia la derecha.

         🚨 LAS DOS SE SUMAN EN EL MISMO NÚMERO y no pueden pisarse: la primera
         termina en 0,238 y la segunda no empieza hasta 0,894. */
      const corriendo = frena(tramo(p, F.corrida[0], F.corrida[1]));
      const viajando = suave(tramo(p, F.viaja[0], F.viaja[1]));
      desplazarFondo(FONDO_AL_FINAL + CORRIDA * corriendo - VIAJE * viajando);

      /* 🚨 Y TODO LO QUE ESTÁ PLANTADO EN EL SUELO SE VA CON ÉL.
         Esto no estaba y se vio en la captura del final: el coche se ponía en
         el centro ENCIMA DEL ONSEN, y la montaña, la poza y el mono seguían ahí
         cuando el guion dice que al final el coche rueda «sin bosque ni nada».

         La regla es la misma que hace rodar al coche: lo que está apoyado en el
         suelo se mueve con el suelo. El fondo corre hacia la derecha, así que
         el onsen, la roca, la poza y el mono corren hacia la derecha con él y
         salen de cuadro. Y no es una decisión de puesta en escena: es lo que
         pasa cuando arranca el coche desde el que estamos mirando.

         🚨 CADA COSA A SU DISTANCIA, que es lo que hace que no parezca un
         decorado de cartón. Lo que está en el plano del suelo va a la velocidad
         del suelo —1,182 unidades por punto de `--fondo`, que es lo ancho de una
         copia de banda entre 100—; la montaña va mucho más despacio porque está
         lejos, y el mono, que ha saltado hacia nosotros, va más deprisa porque
         está más cerca. Es lo único de toda la película con paralaje, y está
         aquí porque es el único sitio donde hay tres planos a la vez. */
      const arrastre = 1.182 * VIAJE * viajando;

      /* ================================================================
         A · VUELVE EL MAPA, Y SE COMPLETA LA RUTA HASTA YAMANOUCHI
         ================================================================
         🚨 LA RUTA ES LA DE VERDAD Y NO LA QUE PARECE. Kusatsu y Yamanouchi
         están a 19 km en línea recta, y la carretera corta —la 292 de Shiga
         Kōgen— CIERRA DE NOVIEMBRE A ABRIL. Son 136 km rodeando por Tsumagoi,
         el paso de Torii, Ueda y Nagano. El cierre está verificado con fuente y
         fechado en datos/carretera-yamanouchi.js.
         ================================================================
         G · Y AL FINAL VUELVE OTRA VEZ, con el otro tramo y su propio encuadre.
         Los dos mapas comparten este bloque porque son la misma capa: lo único
         que cambia es qué ruta, qué encuadre y qué marcadores. */
      const opMapa1 = 0.92 *
        suave(tramo(p, F.mapaEntra[0], F.mapaEntra[1])) *
        (1 - suave(tramo(p, F.mapa1SeVa[0], F.mapa1SeVa[1])));
      const opMapa2 = 0.92 * suave(tramo(p, F.mapa2Entra[0], F.mapa2Entra[1]));
      const opMapa = Math.max(opMapa1, opMapa2);
      const segundo = opMapa2 > opMapa1;

      if (opMapa > 0.004) {
        const v = segundo ? V_MATSUMOTO : V_YAMANOUCHI;
        viajarDeVista(v, v, 0);
        empequeñecerMapa(1);
        mostrarLienzo(true);
        alzarLienzo(1);
        opacidadMapa(opMapa);
        pintarMapa();

        if (segundo) {
          /* De dónde venimos y adónde vamos: la estación de Matsumoto, que es
             donde se deja el coche y donde empieza el acto 7. */
          marcar('yamanouchi', LUGARES.yamanouchi, 1);
          marcar('matsumoto', LUGARES.matsumoto, 1);
          limpiarHitos('yamanouchi', 'matsumoto');
          const avance = tope((p - F.ruta2[0]) / (F.ruta2[1] - F.ruta2[0]));
          pintarRuta(0, RUTA_2, avance, { color: 'var(--acento)', guion: false });
          cerrarHalo('matsumoto', avance);
        } else {
          /* 🚨 Yamanouchi se enciende ANTES de que la línea llegue, como todos
             los destinos de esta web: la carretera no va a ciegas. */
          marcar('kusatsu', LUGARES.kusatsu, 1);
          marcar('yamanouchi', LUGARES.yamanouchi, 1);
          limpiarHitos('kusatsu', 'yamanouchi');
          const avance = tope((p - F.ruta1[0]) / (F.ruta1[1] - F.ruta1[0]));
          pintarRuta(0, RUTA_1, avance, { color: 'var(--acento)', guion: false });
          cerrarHalo('yamanouchi', avance);
        }
        limpiarRutas(1);
      } else {
        /* 🚨 Y AL APAGARLO, DEVOLVERLO A SU TAMAÑO (ley 16). Apagar el mapa no
           deshace el encogido, y aquí el mapa se apaga Y VUELVE dentro del
           mismo acto: sin esto, la segunda vez entraría bien pero cualquier
           acto posterior lo encontraría diminuto y pegado al techo. */
        mostrarLienzo(false);
        limpiarRutas(0);
        empequeñecerMapa(0);
      }

      /* ================================================================
         C · LA MONTAÑA Y LA POZA, QUE ENTRAN CON EL ZOOM
         ================================================================
         Las dos aparecen por opacidad DENTRO de la ventana del zoom, no
         después: son lo que el zoom out está enseñando. Si entraran cuando la
         cámara ya se ha parado, se leería como que alguien las ha puesto ahí. */
      /* 🔁 LA MONTAÑA GRANDE SE QUEDA, Y AHORA LLEGA AL BORDE.
         Dos cosas de la cuarta ronda de Kiko:

         🚨 «Hay un hueco entre la mitad de la montaña y el borde derecho.» Lo
         había: la montaña se colocó para que su pico cayera en el borde de un
         móvil con el zoom al 0,74, y al alejar el zoom al 0,60 la pantalla se
         ensanchó y la montaña se quedó corta. Ahora su sitio SE CALCULA del
         zoom en vez de estar escrito a mano, así que el pico cae en el borde
         con cualquier zoom y en cualquier pantalla.

         🚨 «La montaña grande se debería quedar según se va desplegando a
         Matsumoto, porque Matsumoto tiene vista de los Alpes japoneses.» Así
         que deja de irse con el arrastre: se queda donde está mientras todo lo
         demás se va, y es la primera de las montañas del fondo. */
      const bordeU = (window.innerWidth / unidad) / 2 / zoom;
      const xPico = bordeU - PICO_ANCHO_U / 2;
      colocar('pico', { x: xPico, y: 0, op: 1, escala: 1 });

      /* 🏔️ Y LOS ALPES, QUE VAN ENTRANDO SEGÚN SE VIAJA.
         «Que vayan apareciendo más montañas, para que dé el efecto de que se
         ven las montañas al fondo.» Entran por la derecha con el viaje y a
         velocidades distintas: la fila de delante más deprisa que la de detrás.
         🚨 Eso es paralaje, y es lo único que hace que un fondo parezca
         profundo cuando se mueve. Con las dos a la misma velocidad serían una
         sola valla pintada. */
      const tSierras = suave(tramo(p, F.sierras[0], F.sierras[1]));
      colocar('sierra', {
        x: 130 * (1 - tSierras),
        y: 0, op: 1, escala: 1
      });
      colocar('sierra-lejos', {
        x: 80 * (1 - tSierras),
        y: 0, op: 1, escala: 1
      });

      /* 🔁 LA MONTAÑA DE LOS MONOS YA NO ENTRA POR OPACIDAD: LLEGA ANDANDO.
         Kiko, segunda ronda: «aparece como también de la nada, ya con el mono; y
         no, debería aparecer naturalmente al hacer zoom out». Así que viene por
         la derecha con los árboles, se para a la derecha del todo —medio fuera
         de cuadro—, y **lo que acaba de enseñarla es el zoom out**, que ensancha
         el encuadre. Dos cosas que la descubren, y ninguna es un fundido.
         🚨 Y se para MEDIO FUERA a propósito: «que se vea solamente hasta la
         mitad, desde donde empieza por la izquierda hasta la mitad». Lo que se
         ve es la ladera por la que baja el mono, que es lo único que hace falta. */
      const xMonteMono = X_MONTE_MONO + ENTRADA_MONTE * (1 - corriendo) + arrastre;
      colocar('monte-mono', {
        x: xMonteMono,
        y: 0,
        op: xMonteMono < 190 ? 1 : 0,
        escala: 1
      });

      /* 🚨 LA CIMA, MEDIDA DEL DIBUJO Y NO ESCRITA A MANO (ley 18).
         El perfil de arte/monte-mono.svg se muestrea al cargarlo, así que de
         aquí sale a qué altura está la ladera en cada punto — y con eso se
         colocan la poza en el repecho y el mono bajando por la pendiente.
         Retocar la curva del dibujo los mueve a los dos, sin tocar código.
         Si la pieza todavía no ha llegado, `altura()` devuelve 0 y todo se
         queda a ras de suelo: feo un instante, nunca roto. */
      const perfilMonte = perfilDe('monte-mono');
      const altoMonte = Math.min(0.30 * altoPantalla, 40 * unidad);
      const anchoMonte = MONTE_MONO_ANCHO_U * unidad;
      /* De una `x` del escenario a su sitio dentro de la pieza, de 0 a 1 */
      function sobreElMonte(xu) {
        return (xu - (xMonteMono - MONTE_MONO_ANCHO_U / 2)) / MONTE_MONO_ANCHO_U;
      }
      /* Y de ahí a lo alto que está la ladera ahí, en unidades */
      function laderaU(xu) {
        return altura(perfilMonte, sobreElMonte(xu)) * altoMonte / unidad;
      }

      /* ================================================================
         C.bis · EL MONO, QUE YA ESTABA DENTRO DEL AGUA
         ================================================================
         🔁 EN LA PRIMERA VERSIÓN EL MONO LLEGABA POR LA DERECHA. Kiko lo cambió
         viendo el acto: «que esté el mono ahí dentro del agua y que salte y baje
         hacia nosotros». Cambia lo que da miedo: antes era algo que se acercaba,
         y ahora es algo que llevaba ahí todo el rato y de pronto se te viene
         encima. Es mejor, y además es lo que hacen los monos de Jigokudani.

         El salto es UN SOLO MOVIMIENTO con tres cosas a la vez:
           · sale del agua y baja hacia delante  (la `y`, con un arco)
           · se acerca al centro                  (la `x`)
           · y CRECE                              (la escala)
         🔁 Y EN LA PRIMERA RONDA SE MUDÓ A LA CIMA. Kiko: «que el onsen sea la
         base de la cima de la montaña, y que desde ahí salte el mono y baje por
         la ladera asustando al muñeco». O sea que ya no cae al vacío hacia
         nosotros: **baja rodando por la pendiente**, que es mucho mejor, porque
         el recorrido se ve entero y acaba justo al lado del muñeco.

         🚨 Y LA ALTURA NO ES UNA CURVA INVENTADA: ES LA LADERA. El mono va
         pegado al perfil medido del dibujo en cada punto, igual que el monigote
         baja la montaña del acto 4. Es la ley 18: una sola fuente, y es el
         dibujo.

         La escala sigue contando la distancia —del 55 % arriba en la cima al
         105 % abajo, al lado del muñeco—, que es lo que hace que se lea que se
         acerca y no solo que baja. */
      const tSalta = tramo(p, F.monoSalta[0], F.monoSalta[1]);
      const escalaMono = mezcla(MONO_LEJOS, MONO_CERCA, suave(tSalta));

      /* Dónde se sienta dentro de la poza. Sale de la misma cuenta que el
         muñeco en el acto 5 —el eje del agua está en y=104 de un viewBox de
         150, o sea a un 31 % de la altura de la pieza por encima del suelo— y
         de lo alto que es el mono a esa escala. No es un número a ojo. */
      const pozaAltoU = POZA_ANCHO_U * (150 / 300);
      const aguaPozaU = pozaAltoU * (1 - 104 / 150);
      const monoAltoU = MONO_ANCHO_U * (110 / 130) * MONO_LEJOS;
      /* 🚨 0,55 Y NO 0,42: el agua le tiene que cruzar por el pecho, no por las
         rodillas. Con 0,42 —que es mas o menos lo que usa el acto 5 para el
         muñeco— el mono se quedaba de pie DENTRO de la poza con las piernas
         medio tapadas, y no parecia bañandose sino metido en un barreño. La
         diferencia es que el muñeco esta sentado y el mono esta de pie: la
         proporcion de cuerpo que tiene que quedar bajo el agua no es la misma.
         Se vio en la captura. */
      const hundidoMonoU = monoAltoU * 0.50 - aguaPozaU;

      /* Por dónde va: de la poza de la cima al pie de la ladera, junto al
         onsen. `suave` porque sale de un salto y se va posando. */
      const entradaMonte = ENTRADA_MONTE * (1 - corriendo);
      const xMono = mezcla(X_POZA + entradaMonte, X_MONO_CAE, suave(tSalta)) + arrastre * 1.15;

      /* Y a qué altura: la de la ladera en ese punto, más el hundido de la poza
         mientras todavía está dentro, menos el brinco con el que sale.
         🚨 EN UNIDADES DEL ESCENARIO, NO EN PÍXELES. El primer montaje lo tenía
         en píxeles y el mono salía disparado fuera de la pantalla: en la captura
         del salto no había mono. `colocar` mide la `y` en unidades para todas
         las piezas menos el muñeco y la tabla, que se quedaron en píxeles desde
         el acto 4. Se vio mirando, no leyendo. */
      const yMonoSalta = -laderaU(xMono)
        + hundidoMonoU * (1 - tope(tSalta * 3))
        - MONO_SALTO_U * Math.sin(Math.PI * tSalta);

      colocar('mono', {
        x: xMono,
        y: yMonoSalta,
        op: xMono < 180 ? 1 : 0,
        escala: escalaMono
      });

      /* 🚨 LA POZA VA EN LA CIMA, Y SU ALTURA TAMBIÉN SALE DEL PERFIL.
         «Que arriba haya como un charquito de agua… que el onsen sea la base de
         la cima de la montaña.» Se apoya en el repecho llano del dibujo, y por
         eso su sitio se calcula con `laderaU` en vez de ponerse a ojo: si
         alguien retoca la montaña, la poza sube o baja con ella.
         🚨 Las dos mitades van al mismo sitio, SIEMPRE: son un solo dibujo
         partido por el eje del agua con el mono en medio. */
      variable('--poza-ancho', POZA_ANCHO_U);
      const xPoza = X_POZA + entradaMonte + arrastre;
      const sitioPoza = {
        x: xPoza,
        y: -laderaU(xPoza),
        op: xPoza < 170 ? 1 : 0,
        escala: 1
      };
      colocar('poza-fondo', sitioPoza);
      colocar('poza', sitioPoza);

      /* ================================================================
         LA ROCA Y LA TABLA, que están donde las dejó el acto 5
         ================================================================
         🔁 LA ROCA YA NO SE VA SOLA. En la primera versión se iba enganchada al
         mundo en cuanto el coche arrancaba; ahora el mundo se mueve al revés y,
         sobre todo, Kiko pidió que hasta que el coche acelere «toda la imagen
         [esté] estática». Así que la roca se queda donde estaba y se va con el
         resto del paisaje cuando el mundo empieza a correr — hacia la derecha,
         que es lo que hace el suelo cuando el coche tira hacia la izquierda. */
      /* 🔁 Y ANTES DE ESO, LAS DOS CORREN HACIA LA IZQUIERDA CON EL PAISAJE.
         Kiko, primera ronda: «la tabla y la roca y los árboles del fondo tienen
         que moverse a relativamente alta velocidad hacia la izquierda» mientras
         se dibuja la ruta. Son lo que queda de Kusatsu, y Kusatsu se queda
         atrás: cuando el mundo para, ya no están.
         🚨 ESO SE LLEVA POR DELANTE LA RECOGIDA DE LA TABLA que se decidió en la
         ronda anterior. Si vuelve a hacer falta, la tabla tiene que dejar de
         correr aquí y quedarse a la izquierda. Está avisado en DEFINICION. */
      const xRoca = X_ROCA_PARA - CORRIDA * corriendo * 1.182 + arrastre;
      colocar('roca', {
        x: xRoca,
        /* 🚨 Y SE APAGA CUANDO YA NO CABE. La pantalla mide 100 unidades en un
           móvil y 160 en un portátil ancho, y con el zoom puesto todavía más:
           una roca a opacidad 1 fuera de cuadro es invisible en una pantalla y
           visible en otra. 130 la deja fuera en todas. */
        y: 0,
        op: (xRoca > -140 && xRoca < 140) ? 1 : 0,
        escala: 1
      });

      /* ================================================================
         D · EL SUSTO, Y SALIR DEL AGUA
         ================================================================
         «El muñeco lo ve, se asusta, sale hacia la izquierda corriendo.»

         Tres cosas seguidas y una sola trayectoria:
           · susto        un respingo dentro del agua, sin salir
           · saleDelAgua  se levanta hasta quedarse de pie en el suelo
           · corre        cruza hacia la izquierda, recoge la tabla y se va

         🚨 DÓNDE CAMBIA LA POSTURA, que es lo único delicado de este bloque. En
         el acto 5 el cambio pasaba DEBAJO DEL AGUA, que es la tapadera
         perfecta. Aquí no hay tapadera: sale a la vista. Así que se cambia lo
         más pronto posible dentro de la subida —cuando todavía le tapa la mitad
         de delante del onsen de cintura para abajo— y no al final, que es
         cuando ya se le ve entero. Y las dos posturas tienen la cabeza a
         alturas distintas a propósito (ver arte/monigote.svg): la de correr va
         más baja porque el cuerpo está inclinado. */
      const hundido = HUNDIDO_U * unidad;
      const tSusto = tramo(p, F.susto[0], F.susto[1]);
      const tSale = tramo(p, F.saleDelAgua[0], F.saleDelAgua[1]);
      const tCorre = tramo(p, F.corre[0], F.corre[1]);

      /* El respingo: sube un poco y vuelve. El seno hace las dos cosas con una
         línea y llega a cero exacto por los dos lados, igual que el salto de la
         tabla en el acto 5. */
      let yMono2 = hundido - 2.2 * unidad * Math.sin(Math.PI * tSusto);
      if (tSale > 0) yMono2 = mezcla(hundido, 0, frena(tSale));

      const xMuñeco = tCorre > 0 ? mezcla(0, X_CORRE_FIN, suave(tCorre)) : 0;

      /* 🚨 LA CURVA DE LA CARRERA ES `suave` Y NO UNA ACELERACIÓN, Y EL MOTIVO
         ES LA TABLA. Con el cuadrado —que es lo que parece natural para alguien
         que sale corriendo de un susto— la carrera va muy por detrás al
         principio: recorrer las cuatro quintas partes del camino, que es donde
         está la tabla, se come el 89 % del tiempo. O sea que la recogía en el
         último suspiro y desaparecía dentro del coche en el mismo golpe, y no
         se veía ninguna de las dos cosas. Con `suave` la pasa al 72 % y se le ve
         correr con ella media pantalla antes de meterse.
         Se vio en la captura, no leyendo el código. */

      /* Se mete en el coche: «no hace falta animación, simplemente cuando llega
         al coche desaparece». Literal, y por eso es un corte y no un fundido:
         un fundido sería desvanecerse, que es otra cosa. */
      const dentro = p >= F.seMete[0];

      postura('monigote', tSale > 0.18 ? 'corre' : 'onsen');
      colocar('monigote', {
        x: xMuñeco,
        y: yMono2,
        op: dentro ? 0 : 1,
        escala: 1,
        giro: 0
      });

      /* --- La tabla, que la recoge al pasar ------------------------------
         🚨 ESTO LO DECIDIÓ KIKO, y con su motivo: «el material se devuelve en
         Matsumoto, que es adonde va el coche: dejarla enterrada en Kusatsu es
         un cabo suelto que se ve. Sin agacharse: la coge al vuelo».

         Y es barato porque ya estaba resuelto: desde que la pisa, la tabla
         vuelve a ir pegada a él —misma x, misma y, mismo giro—, que es
         exactamente el estado del acto 4. Las dos piezas comparten `viewBox` y
         tamaño para poder hacer justo esto.

         Se recoge cuando él la alcanza, o sea cuando su x pasa de la de la
         tabla; no en un punto del scroll elegido a ojo. Así sigue cuadrando el
         día que se cambie lo que corre o dónde cayó la tabla. */
      /* 🚨 LA LLEVA DE PIE, NO DEBAJO DE LOS PIES. Es el único sitio donde NO
         vale el truco de darles la misma x, la misma y y el mismo giro: con el
         giro a 0 la tabla vuelve a quedarse bajo sus botas, que es la postura
         de los actos 4 y 5, y con él corriendo encima parecía que hacía snow
         por la nieve llana. Se vio en la captura.
         Girada -70° alrededor de la base de su caja se pone casi vertical, y
         cinco unidades a su derecha queda por detrás de él según corre hacia la
         izquierda: la lleva al costado, como quien se lleva una tabla. */
      /* 🔁 Y LA TABLA YA NO SE RECOGE, porque para cuando él corre ya no está.
         En la primera ronda se decidió que la recogía al pasar; en esta, Kiko
         pidió que la tabla corriera hacia la izquierda con el resto del paisaje
         de Kusatsu mientras se dibuja la ruta. Las dos cosas no caben: si se va
         con Kusatsu, no está aquí para recogerla. Se ha hecho lo último, que es
         lo que dijo después, y queda avisado en DEFINICION. */
      const xTabla = X_TABLA_CAE - CORRIDA * corriendo * 1.182 + arrastre;
      const recogida = corriendo <= 0 && xMuñeco <= X_TABLA_CAE;
      if (recogida) {
        colocar('tabla', { x: xMuñeco + 5, y: yMono2, op: dentro ? 0 : 1, escala: 1, giro: -70 });
      } else {
        /* Donde la dejó el acto 5: tumbada, girada casi media vuelta y
           levantada dos unidades para que no se hunda por debajo del borde
           —el giro va alrededor de la base de su caja, y en este acto el suelo
           es el canto inferior de la pantalla—. */
        colocar('tabla', {
          x: xTabla,
          y: -2.0 * unidad,
          op: (xTabla > -150 && xTabla < 140) ? 1 : 0,
          escala: 1,
          giro: -172
        });
      }

      /* ================================================================
         E · EL ONSEN SE QUEDA
         ================================================================
         🔁 ESTO ERA LO CONTRARIO Y LO CAMBIÓ KIKO. El guion original decía que
         «deja el onsen y el mono, que se van hacia la derecha», y así se filmó.
         Viendo el acto pidió justo lo otro: «el personaje se asusta y se va
         hacia el coche, pero dejando el onsen y TODA LA IMAGEN ESTÁTICA hasta
         que ya el coche acelere».

         Así que el onsen no se mueve, y el mono tampoco después de caer: lo que
         queda es un plano quieto con la poza vacía, el mono plantado delante y
         el muñeco cruzando hacia el coche. Es mejor, y es más barato: cuatro
         piezas que dejan de escribirse en cada fotograma.
         🚨 Las dos mitades siguen yendo al mismo sitio, siempre. */
      const xOnsen = arrastre;
      /* 🏨 Y DETRÁS DE ÉL, EL HOTEL — よろづや, el 桃山風呂.
         Entra cuando la ruta ya ha llegado a Yamanouchi y el paisaje casi se ha
         parado: es el premio del viaje que se acaba de contar en el mapa. Kiko:
         «haciendo ver como que nos estamos bañando en el onsen que está justo
         enfrente de esa estructura».
         🚨 Y va en el HTML entre las bandas y el onsen, que es lo que hace la
         escena: por delante de los árboles y por detrás del muñeco. Aquí solo se
         coloca; quien manda en el orden de pintado es el HTML.
         Está en el plano del suelo, así que corre con él al final. */
      /* 🔁 Y VIENE POR LA DERECHA CON LOS ARBOLES, no por un fundido. Kiko,
         segunda ronda: «aparece de la nada, como de desvanecido, y deberia venir
         por la derecha, junto con los arboles, hasta que se queda en el medio».
         Va colgado de la misma curva que el bosque, asi que comparten velocidad
         exacta y frenan a la vez — que es lo que hace que llegue en vez de
         aparecer. Y se para CENTRADO: antes estaba cuatro unidades a la
         izquierda y se notaba. */
      const xHotel = X_HOTEL + ENTRADA_HOTEL * (1 - corriendo) + arrastre;
      colocar('yorozuya', {
        x: xHotel,
        y: 0,
        op: xHotel < 190 ? 1 : 0,
        escala: 1
      });

      /* 🏯 Y AL FINAL DEL TODO, EL CASTILLO DE MATSUMOTO.
         Kiko: «cuando estoy llegando a Matsumoto, igual que como con el hotel
         anterior, que ahora en este caso muestre el castillo de Matsumoto y las
         montañas que ya están al fondo».
         Así que hace lo mismo que el hotel: **llega por la derecha** con el
         mundo y frena. Ni un fundido — es la regla del acto.
         🚨 Y se queda: es el último fotograma de la película por ahora, y el
         acto 7 empieza justo ahí, haciendo zoom a la estación. */
      const tCastillo = suave(tramo(p, F.castillo[0], F.castillo[1]));
      colocar('matsumoto', {
        x: -bordeU + CASTILLO_ANCHO_U / 2 + ENTRADA_CASTILLO * (1 - tCastillo),
        y: 0,
        op: tCastillo > 0 ? 1 : 0,
        escala: 1
      });

      const sitioOnsen = { x: xOnsen, y: 0, op: xOnsen < 140 ? 1 : 0, escala: 1 };
      colocar('onsen-fondo', sitioOnsen);
      colocar('onsen', sitioOnsen);

      /* ================================================================
         F · EL COCHE
         ================================================================
         «Por la izquierda aparece otra vez el mismo coche.» El mismo de verdad:
         es la pieza del acto 3, que sigue viviendo en la capa del dibujo desde
         entonces. Este acto solo tiene que volver a encenderla y moverla — que
         es exactamente la razón por la que el dibujo no pertenece a ningún acto.

         🔁 Y AHORA ENTRA CON EL ZOOM, no cuando el muñeco ya corre. Kiko:
         «aparecer a la izquierda el coche y a la derecha una especie de
         montaña». O sea que el coche es parte de lo que el zoom out enseña, y
         está ahí esperando mucho antes del susto — que además es lo que hace
         que la huida tenga adónde ir.

         Entra frenando (`frena`), que es lo que hace un coche que para a
         recoger a alguien.

         🚨 Y DESPUÉS ARRANCA EN DOS TIEMPOS, que es lo que pidió: «primero
         hacia la derecha, como para quedarse en el medio, y luego del medio
         hacia la izquierda». Lo primero es el coche moviéndose de verdad —de
         donde recogió hasta el centro—; lo segundo NO lo hace el coche, lo hace
         el mundo, que empieza a correr hacia la derecha (ver `viajando`, arriba).
         Es el truco del acto 3 con el signo cambiado, y va hacia la izquierda
         porque Matsumoto está al oeste. */
      const tCoche = tramo(p, F.entraCoche[0], F.entraCoche[1]);
      /* 🔁 Y NO SE MUEVE POR SU CUENTA: LO MUEVE LA ESCENA. Kiko lo corrigió en
         la primera ronda: «en realidad se va toda la escena, como que toda la
         escena se va a la derecha dejando al coche en el medio, y el coche ya va
         directamente hacia la izquierda, no que el coche se mueva hacia la
         derecha». Y tiene razón: con el coche desplazándose él solo hacia la
         derecha, lo que se lee durante ese golpe es un coche yendo al este, que
         es justo lo contrario del viaje.

         Así que el coche va enganchado al MISMO arrastre que el onsen y la roca
         —está aparcado y el mundo se lo lleva— y se suelta al llegar al centro,
         que es donde se queda rodando. Un `Math.min` en vez de una ventana
         propia: no hay dos movimientos, hay uno solo que se para en el medio. */
      colocar('coche', {
        x: Math.min(0, mezcla(X_COCHE_ENTRA, X_COCHE_PARA, frena(tCoche)) + arrastre),
        y: 0,
        op: tCoche > 0 ? 1 : 0,
        escala: 1
      });

      /* ================================================================
         EL TEXTO
         ================================================================
         Todo en placeholder: de Yamanouchi no hay nada elegido todavía. Lo
         único con dato son los dos tramos, y los dos van marcados por verificar
         porque el tiempo sale de medir la carretera a velocidad libre.
         🚨 Los dos datos comparten sitio en la pantalla y NUNCA coinciden: el
         primero se va en 0,272 y el segundo entra en 0,900. */
      acto.v('--p-viaje-1',
        suave(tramo(p, F.viaje1Dent[0], F.viaje1Dent[1])) *
        (1 - suave(tramo(p, F.viaje1Fuer[0], F.viaje1Fuer[1]))));
      acto.v('--p-viaje-2',
        suave(tramo(p, F.viaje2Dent[0], F.viaje2Dent[1])) *
        (1 - suave(tramo(p, F.viaje2Fuer[0], F.viaje2Fuer[1]))));

      acto.v('--p-sube', suave(tramo(p, F.datosSube[0], F.datosSube[1])));
      acto.v('--p-datos',
        suave(tramo(p, F.datosDent[0], F.datosDent[1])) *
        (1 - suave(tramo(p, F.datosFuer[0], F.datosFuer[1]))));
    }
  });
}
