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

import { registrarActo } from '../motor/escenario.js?v=235063c6';
import { tramo, suave, tope, frena, mezcla } from '../motor/util.js?v=235063c6';
import { encuadrar, viajarDeVista } from '../motor/proyeccion.js?v=235063c6';
import { pintarMapa, pintarRuta, limpiarRutas, marcar, mostrarLienzo, opacidadMapa, cerrarHalo, alzarLienzo, empequeñecerMapa, limpiarHitos } from '../motor/lienzo.js?v=235063c6';
import { mostrarDibujo, colocar, variable, verBanda, desplazarFondo, bajarSuelo, limpiarPiezas, postura } from '../motor/dibujo.js?v=235063c6';
import { nevar, nieveHastaElSuelo } from '../motor/nieve.js?v=235063c6';
import { tenderRuta } from '../motor/ruta.js?v=235063c6';
import { LUGARES, RUTA_A_YAMANOUCHI, RUTA_A_MATSUMOTO, ENCUADRES } from '../datos/rutas.js?v=235063c6';
/* 🚨 LO ÚNICO QUE ESTE ACTO IMPORTA DE OTRO ACTO, y es a propósito: son los
   cuatro números con los que acaba el acto 5, o sea el fotograma del que este
   arranca (ley 5). Escritos a mano aquí serían el mismo número en dos archivos
   —regla 1 del repositorio—, y el día que alguien mueva la tabla o cambie lo
   ancho del onsen, el acto 6 abriría con las cosas en otro sitio que el 5. */
import { HUNDIDO_U, ONSEN_ANCHO_U, X_TABLA_CAE, X_ROCA_PARA, FONDO_AL_FINAL } from './05-kusatsu.js?v=235063c6';

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

  /* B · los datos. Dos ventanas para el panel y no una, como en los actos 4 y
     5: --p-sube solo va hacia delante y --p-datos es lo que se ve, para que al
     final se desvanezca QUIETO en vez de irse por donde vino. */
  datosSube:  [0.268, 0.352],
  datosDent:  [0.268, 0.330],
  datosFuer:  [0.428, 0.478],

  /* C · el mono. «Aparece por la derecha… y avanza ligeramente hacia la
     izquierda sin llegar al onsen.» Son dos movimientos y no uno: entra de
     fuera hasta su sitio, y DESPUÉS avanza ese poco más. Con una sola ventana
     no hay «ligeramente»: hay una cosa que entra y se para. */
  monoEntra:  [0.488, 0.556],
  monoAvanza: [0.556, 0.600],

  /* D · el susto y la huida.
     🚨 TRES VENTANAS QUE SE RELEVAN EN EL MISMO NÚMERO, no solapadas. Es el
     fallo que costó el acto 5: la ventana de la embestida acababa un pelo
     DESPUÉS de que empezara la del vuelo, las dos mandaban sobre la misma
     coordenada y el muñeco despegaba sin haber llegado a la roca. Aquí el
     respingo, la salida del agua y la carrera mandan todos sobre su `y` o su
     `x`, así que casan exactos. */
  susto:      [0.600, 0.628],
  /* 🚨 LA SALIDA DEL AGUA Y LA CARRERA SE SOLAPAN A PROPÓSITO, y esto se vio en
     la captura: con la subida terminando antes de que empezara la carrera había
     medio golpe entero con el muñeco DE PIE DENTRO DEL ONSEN, tapado de cintura
     para abajo por la mitad de delante. En pantalla no parecía que estuviera
     saliendo: parecía que estaba agachado en la bañera.
     Y no choca con la ley 6: estas dos ventanas mandan sobre coordenadas
     DISTINTAS —una sobre la altura y otra sobre la posición—, que es justo
     cuando el solape es bueno. Lo que no puede solaparse son dos ventanas que
     manden sobre lo mismo, que es lo que costó el golpe de la roca del acto 5. */
  saleDelAgua:[0.628, 0.700],
  corre:      [0.645, 0.800],

  /* E · «deja el onsen y el mono, que se van hacia la derecha». Empieza en
     cuanto él ya está fuera del agua: si se van antes, se ve al muñeco de pie
     donde estaba el onsen sin que el onsen se haya movido. */
  seVan:      [0.700, 0.800],

  /* F · el coche. Entra MIENTRAS él corre, no después: el guion dice que
     aparece por la izquierda y que «cuando llega al coche desaparece», o sea
     que el coche tiene que estar ya ahí cuando él llega. */
  cocheEntra: [0.722, 0.796],
  seMete:     [0.800, 0.812],
  /* 🚨 Y EN CUANTO ESTA DENTRO, EL COCHE SE CENTRA. «El coche se queda ahi
     abajo haciendo como una animacion de moverse, COMO LA DE CUANDO VENIAMOS»,
     y cuando veniamos —acto 3— el coche estaba en el centro de la pantalla y lo
     que se movia era el mundo. Parado donde recoge, se queda pegado al borde
     izquierdo y medio fuera: se vio en la captura del final. */
  cocheCentra:[0.812, 0.884],

  /* G · el final.
     🚨 LOS ÁRBOLES SE APAGAN UNO A UNO, y esta ventana es la del acto entero
     que más despacio va a propósito: son nueve ranuras en pantalla y pico, o
     sea que cada árbol tiene su momento. Con la mitad de sitio se lee como un
     fundido, que es justo lo que Kiko NO quería. */
  pelaBosque: [0.812, 0.905],
  mapa2Entra: [0.840, 0.890],
  ruta2:      [0.892, 0.985],
  viaje2Dent: [0.905, 0.952]
};

/* --------------------------------------------------------------------------
   Dónde para cada cosa
   -------------------------------------------------------------------------- */
/* Por dónde entra el mono: fuera de la pantalla por la derecha —la pantalla
   mide 100u, de -50 a +50, y él mide 22— y dónde se planta.
   🚨 «SIN LLEGAR AL ONSEN», Y ESO SON NÚMEROS: el onsen mide 32u y está
   centrado, así que su borde derecho está en +16. El mono mide 22u y se ancla
   por su centro, o sea que parado en +30 su costado izquierdo queda en +19.
   Tres unidades de aire entre los dos: cerca, y sin tocarlo. */
const X_MONO_ENTRA = 72;
const X_MONO_PARA = 40;
const X_MONO_AVANZA = 35;

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

/* Dónde para el coche.
   🚨 46 UNIDADES DE ANCHO, que es casi media pantalla, y de ahí sale este
   número: anclado por su centro en -27, el coche ocupa de -50 a -4, o sea que
   entra JUSTO ENTERO por la izquierda sin salirse. Con el coche más a la
   izquierda se le corta el maletero y parece que sigue llegando; más a la
   derecha, le pasa por encima al onsen mientras el onsen todavía se está yendo. */
const X_COCHE_PARA = -27;
const X_COCHE_ENTRA = -110;

/* Adónde se van el onsen y el mono: fuera por la derecha.
   🚨 110 Y NO 95, Y EL NÚMERO SALE DE UNA CUENTA. La unidad del escenario es
   `vmin`, así que la pantalla mide 100 unidades en un móvil pero 160 en un
   portátil de 1440x900 —de -80 a +80—. El onsen mide 32u y se ancla por su
   centro, o sea que con el centro en 95 su borde izquierdo queda en 79: DENTRO
   de la pantalla ancha por una unidad. Se veía el canto del onsen pegado al
   borde derecho durante el final entero del acto, y solo en pantalla ancha.
   Con 110 el borde queda en 94, catorce unidades fuera. */
const X_FUERA_DERECHA = 110;

/* Cuánto fondo pasa mientras el coche rueda al final.
   🚨 EL ACTO 5 LO DEJA PARADO en FONDO_AL_FINAL, así que aquí se arranca de ahí
   y se vuelve a mover cuando el coche ya está puesto. Es lo mismo que hace el
   acto 5 con lo que le deja el 4. La curva es `suave` y no `frena`: el coche
   arranca y se queda rodando, no frena. */
const RODAJE = 520;

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
const RANURAS = 12;

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
  limpiarPiezas('monigote', 'tabla', 'roca', 'onsen', 'onsen-fondo', 'mono', 'coche');
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

      /* El fondo. Quieto donde lo dejó el acto 5 hasta que el coche arranca:
         durante los seis primeros golpes no se mueve nada del paisaje, que es
         lo que hace que el mono y la huida se lean. */
      const rodando = suave(tramo(p, F.seMete[1], 1));
      desplazarFondo(FONDO_AL_FINAL + RODAJE * rodando);

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
         C · EL MONO
         ================================================================
         «Aparece por la derecha un mono de la nieve, de estos japoneses de
         Nagano, de Jigokudani, y avanza ligeramente hacia la izquierda sin
         llegar al onsen.»

         Dos tramos y no uno: entra desde fuera hasta su sitio, y entonces
         avanza ese poco más. El segundo es corto a propósito —cuatro unidades—
         porque «ligeramente» es eso: lo justo para que se vea que no se ha
         quedado quieto, y que es lo que hace que el muñeco reaccione. */
      const tMonoEntra = suave(tramo(p, F.monoEntra[0], F.monoEntra[1]));
      const tMonoAvanza = suave(tramo(p, F.monoAvanza[0], F.monoAvanza[1]));
      const tSeVan = suave(tramo(p, F.seVan[0], F.seVan[1]));
      const xMono = tSeVan > 0
        ? mezcla(X_MONO_AVANZA, X_FUERA_DERECHA, tSeVan)
        : mezcla(mezcla(X_MONO_ENTRA, X_MONO_PARA, tMonoEntra), X_MONO_AVANZA, tMonoAvanza);
      /* 🚨 Y SE APAGA AL SALIR, no basta con mandarlo fuera de la pantalla.
         Una pieza a opacidad 1 en x=95 no se ve en un móvil y SÍ se ve en un
         portátil ancho: la unidad del escenario es `vmin`, así que en 1440×900
         la pantalla mide 160 unidades y no 100, y el mono se quedaría asomando
         por el borde durante el final del acto. Además, apagada de verdad el
         motor la esconde con `hidden` y deja de costar capa (ley 14). */
      colocar('mono', {
        x: xMono,
        y: 0,
        op: (tMonoEntra > 0 && tSeVan < 0.999) ? 1 : 0,
        escala: 1
      });

      /* ================================================================
         LA ROCA Y LA TABLA, que están donde las dejó el acto 5
         ================================================================
         🚨 LA ROCA NO SE VA CON EL ONSEN. El guion dice que se van el onsen y
         el mono, y de la roca no dice nada — pero al final el coche rueda «sin
         bosque ni nada», y una piedra plantada en el medio contradice el «ni
         nada». Así que se va como se tiene que ir: ENGANCHADA AL MUNDO. En
         cuanto el coche arranca, el suelo empieza a correr hacia la izquierda y
         la roca corre con él, igual que en el acto 5 entraba colgada de esa
         misma curva. No es una decisión de puesta en escena, es lo que hace una
         piedra cuando el coche que la mira echa a andar. */
      const xRoca = X_ROCA_PARA - RODAJE * rodando * 0.25;
      colocar('roca', {
        x: xRoca,
        /* 🚨 Y SE APAGA CUANDO YA NO CABE, por lo mismo que el mono: la
           pantalla mide 100 unidades en un móvil y 160 en un portátil ancho, y
           una roca a opacidad 1 en x=-105 es invisible en uno y visible en el
           otro. La roca mide 16u y se ancla por su centro, así que para estar
           fuera de una pantalla de 160 unidades su centro tiene que pasar de
           -88; -92 deja cuatro unidades de margen. */
        y: 0,
        op: xRoca > -92 ? 1 : 0,
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
      const recogida = xMuñeco <= X_TABLA_CAE;
      if (recogida) {
        colocar('tabla', { x: xMuñeco + 5, y: yMono2, op: dentro ? 0 : 1, escala: 1, giro: -70 });
      } else {
        /* Donde la dejó el acto 5: tumbada, girada casi media vuelta y
           levantada dos unidades para que no se hunda por debajo del borde
           —el giro va alrededor de la base de su caja, y en este acto el suelo
           es el canto inferior de la pantalla—. */
        colocar('tabla', { x: X_TABLA_CAE, y: -2.0 * unidad, op: 1, escala: 1, giro: -172 });
      }

      /* ================================================================
         E · EL ONSEN SE VA
         ================================================================
         «Deja el onsen y el mono, que se van hacia la derecha.»
         🚨 LAS DOS MITADES VAN AL MISMO SITIO, SIEMPRE. Son un solo dibujo
         partido por el eje del agua: en cuanto una se mueva un píxel más que la
         otra, se ve la juntura. */
      const xOnsen = mezcla(0, X_FUERA_DERECHA, tSeVan);
      const sitioOnsen = { x: xOnsen, y: 0, op: tSeVan < 0.999 ? 1 : 0, escala: 1 };
      colocar('onsen-fondo', sitioOnsen);
      colocar('onsen', sitioOnsen);

      /* ================================================================
         F · EL COCHE
         ================================================================
         «Por la izquierda aparece otra vez el mismo coche.» El mismo de verdad:
         es la pieza del acto 3, que sigue viviendo en la capa del dibujo desde
         entonces. Este acto solo tiene que volver a encenderla y moverla — que
         es exactamente la razón por la que el dibujo no pertenece a ningún acto.

         Entra frenando (`frena`), que es lo que hace un coche que para a
         recoger a alguien. */
      const tCoche = tramo(p, F.cocheEntra[0], F.cocheEntra[1]);
      const tCentra = suave(tramo(p, F.cocheCentra[0], F.cocheCentra[1]));
      colocar('coche', {
        x: mezcla(mezcla(X_COCHE_ENTRA, X_COCHE_PARA, frena(tCoche)), 0, tCentra),
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
      acto.v('--p-viaje-2', suave(tramo(p, F.viaje2Dent[0], F.viaje2Dent[1])));

      acto.v('--p-sube', suave(tramo(p, F.datosSube[0], F.datosSube[1])));
      acto.v('--p-datos',
        suave(tramo(p, F.datosDent[0], F.datosDent[1])) *
        (1 - suave(tramo(p, F.datosFuer[0], F.datosFuer[1]))));
    }
  });
}
