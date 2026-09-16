/* =============================================================================
   datos/rutas.js · Los sitios y los caminos entre ellos
   -----------------------------------------------------------------------------
   🚨 NINGUNA COORDENADA ESTÁ INVENTADA (regla 3 del repositorio). Todas se
   consultaron una a una en Nominatim/OpenStreetMap el 16 de septiembre de 2026,
   y se dan por buenas porque el resultado devolvía el nombre japonés correcto
   (明大前 en 松原一丁目, 世田谷区; 宝川温泉 汪泉閣 en みなかみ町; y así).

   Lo que aún NO está verificado va marcado con ⚠️ y no se presenta como hecho.

   Contexto y fuentes → investigacion/021-rutas-de-la-pelicula.md
   ============================================================================= */

/* --------------------------------------------------------------------------
   1 · Los sitios
   --------------------------------------------------------------------------
   [lon, lat]. Se guardan sueltos porque unos son marcadores y otros solo son
   puntos de paso por los que la línea tiene que doblar.
   -------------------------------------------------------------------------- */
export const LUGARES = {
  /* España */
  madrid:        [-3.7000, 40.4000],

  /* Japón · aeropuerto y corredor del N'EX */
  narita:        [140.3933, 35.7759],   /* 成田国際空港 ✅ */
  naritaEstacion:[140.3141, 35.7778],   /* 成田駅 ✅ */
  sakura:        [140.2260, 35.7094],   /* 佐倉駅 ✅ */
  yotsukaido:    [140.1656, 35.6630],   /* 四街道駅 ✅ */
  chiba:         [140.1146, 35.6133],   /* 千葉駅 ✅ */
  funabashi:     [139.9850, 35.7017],   /* 船橋駅 ✅ */
  tokio:         [139.7650, 35.6811],   /* 東京駅 ✅ */
  shinagawa:     [139.7392, 35.6287],   /* 品川駅 ✅ */
  shibuya:       [139.7001, 35.6596],   /* 渋谷駅 ✅ */
  shinjuku:      [139.6991, 35.6884],   /* 新宿駅 ✅ */
  sasazuka:      [139.6672, 35.6746],   /* 笹塚駅 ✅ */
  meidaimae:     [139.6504, 35.6684],   /* 明大前駅 ✅ */

  /* 📍 El alojamiento de Tokio. Kiko decidió el 16 de septiembre que el punto
     exacto se marca en la web pública, avisado de que NORMAS § 7 lo prohibía.
     Coordenada del centro de 松原一丁目: el portal cae dentro, y a cualquier
     zoom de la película la diferencia es menos de un píxel. */
  alojamientoTokio: [139.6534, 35.6681],

  /* Japón · la nieve */
  takaragawa:    [139.0468, 36.8480],   /* 宝川温泉 汪泉閣 ✅ */
  kusatsu:       [138.5967, 36.6229],   /* 湯畑, el centro de Kusatsu ✅ */
  ueda:          [138.2496, 36.3966],   /* 上田駅 ✅ — el rodeo de invierno */
  nagano:        [138.1870, 36.6428],   /* 長野駅 ✅ */
  yamanouchi:    [138.4306, 36.7344],   /* 渋温泉, 山ノ内町 ✅ */
  jigokudani:    [138.4623, 36.7328],   /* 地獄谷野猿公苑 ✅ */
  matsumoto:     [137.9644, 36.2307],   /* 松本駅 ✅ */

  /* Japón · el tren a Kioto */
  nagoya:        [136.8824, 35.1688],   /* 名古屋駅 ✅ */
  kioto:         [135.7587, 34.9867],   /* 京都駅 ✅ */
  kiyomizuGojo:  [135.7684, 34.9956],   /* 清水五条駅 ✅ */

  /* 📍 El alojamiento de Kioto, misma decisión que el de Tokio */
  alojamientoKioto: [135.7724, 34.9984] /* 弓矢町, 東山区 ✅ */
};

/* --------------------------------------------------------------------------
   2 · El vuelo de ida
   --------------------------------------------------------------------------
   🚨 NO es la línea recta del mapa. Con el espacio aéreo ruso cerrado, Iberia
   sale por el Mediterráneo, cruza Turquía y el Cáucaso y sigue por Kazajistán
   y China. Verificado el 15 de septiembre de 2026 con dos fuentes
   → investigacion/020-los-vuelos.md
   -------------------------------------------------------------------------- */
export const VUELO_IDA = [
  [-3.7, 40.4],    /* Madrid */
  [0.5, 41.2],     /* costa catalana */
  [8.5, 40.5],     /* entre Córcega y Cerdeña */
  [15.5, 39.5],    /* sur de Italia */
  [21.5, 38.5],    /* Grecia */
  [27.5, 38.0],    /* mar Egeo */
  [33.0, 38.5],    /* Anatolia */
  [40.0, 40.0],    /* este de Turquía */
  [46.0, 41.0],    /* Cáucaso */
  [51.0, 42.5],    /* mar Caspio */
  [58.0, 44.0],    /* Kazajistán, mar de Aral */
  [66.0, 45.0],    /* Kazajistán */
  [74.0, 44.5],    /* Kazajistán, hacia Xinjiang */
  [82.0, 44.0],    /* Xinjiang */
  [90.0, 43.5],    /* China */
  [98.0, 42.5],    /* China */
  [106.0, 41.5],   /* China */
  [114.0, 40.5],   /* China, cerca de Pekín */
  [121.0, 39.0],   /* mar de Bohai */
  [127.5, 37.5],   /* península de Corea */
  [133.0, 36.5],   /* mar de Japón */
  [138.0, 36.0],   /* Honshu */
  [140.3933, 35.7759]  /* Narita */
];

/* --------------------------------------------------------------------------
   3 · Del aeropuerto al alojamiento de Tokio
   --------------------------------------------------------------------------
   💭 De las dos opciones buenas se dibuja la B, por Shinjuku: siete minutos más
   que por Shibuya, pero el transbordo es mucho más llevadero con cuatro
   personas y equipaje de 26 noches, y Shinjuku es donde se recoge el coche.
   ⬜ Kiko no ha elegido todavía → investigacion/021.

   ⚠️ LOS COLORES NO ESTÁN VERIFICADOS. La Wikipedia da los códigos de línea
   (KO, IN) pero no el color oficial, y en esta web el color de una línea es un
   dato, no decoración. Hay que comprobarlos en la web de Keio y de JR East
   antes de darlos por buenos.
   -------------------------------------------------------------------------- */
const L = LUGARES;

export const TRAMOS_LLEGADA = [
  {
    id: 'nex',
    nombre: 'Narita Express',
    codigo: 'N’EX',
    operador: 'JR East',
    color: '#c8102e',            /* ⚠️ sin verificar */
    minutos: 82,                 /* ✅ ~80-85 min hasta Shinjuku */
    precio: '¥3.140',       /* ✅ */
    desde: 'Narita T2',
    hasta: 'Shinjuku',
    estado: 'ok',
    pasos: [
      L.narita, L.naritaEstacion, L.sakura, L.yotsukaido, L.chiba,
      L.funabashi, L.tokio, L.shinagawa, L.shibuya, L.shinjuku
    ]
  },
  {
    id: 'keio',
    nombre: 'Línea Keio',
    codigo: 'KO',                /* ✅ verificado */
    operador: 'Keio',
    color: '#d3238b',            /* ⚠️ sin verificar */
    minutos: 7,                  /* ✅ */
    precio: '¥170',         /* ⚠️ sin verificar */
    desde: 'Shinjuku',
    hasta: 'Meidaimae',
    estado: 'duda',
    pasos: [L.shinjuku, L.sasazuka, L.meidaimae]
  },
  {
    id: 'pie',
    nombre: 'A pie',
    codigo: '',
    operador: '',
    color: '#6e747c',
    minutos: 3,                  /* ✅ */
    precio: '',
    desde: 'Meidaimae',
    hasta: 'el alojamiento',
    estado: 'ok',
    pasos: [L.meidaimae, L.alojamientoTokio]
  }
];

/* --------------------------------------------------------------------------
   4 · Del alojamiento al coche · el acto 3
   --------------------------------------------------------------------------
   La misma línea Keio del tramo de llegada, al revés: se vuelve a Shinjuku,
   que es donde se recoge el coche. Es LO ÚLTIMO QUE HACE EL MAPA en toda la
   película hasta el acto 5.

   Kiko, guion A3: «nos desplazamos hasta el centro de recogida del coche» y
   «cuando la línea del transporte en metro se complete hasta ese punto, se
   empieza a hacer zoom, zoom, zoom hasta que el mapa se difumina por completo».
   Confirmado por él el 17 de septiembre: primero la línea entera, y ENTONCES
   el zoom.

   ⚠️ EL PUNTO DE RECOGIDA NO ESTÁ DECIDIDO: «por Shinjuku, de momento»
   (PENDIENTE W8). Lo que se marca es la ESTACIÓN de Shinjuku, que sí está
   verificada, y el texto lo dice con su marca. No se inventa una oficina.
   -------------------------------------------------------------------------- */
export const TRAMO_AL_COCHE = {
  id: 'al-coche',
  nombre: 'Línea Keio',
  codigo: 'KO',                /* ✅ verificado */
  operador: 'Keio',
  color: '#d3238b',            /* ⚠️ sin verificar, igual que en la llegada */
  minutos: 7,                  /* ✅ */
  desde: 'Meidaimae',
  hasta: 'Shinjuku',
  pasos: [L.alojamientoTokio, L.meidaimae, L.sasazuka, L.shinjuku]
};

/* --------------------------------------------------------------------------
   5 · Encuadres de la cámara
   --------------------------------------------------------------------------
   [lon, lat, gradosDeAncho]. El radio lo calcula `encuadrar()`, porque pensar
   en grados de ancho es humano y pensar en radios no.
   -------------------------------------------------------------------------- */
export const ENCUADRES = {
  japon:  [138.0, 37.5, 26],
  kanto:  [139.9, 35.75, 3.4],
  /* 🚨 Centrado entre los dos extremos y con holgura: con 1,15° la etiqueta de
     Narita se salia por el borde derecho y chocaba con el rail. Se vio en
     pantalla, no leyendo el codigo. */
  ruta:   [140.02, 35.72, 1.7],
  /* Shinjuku, Sasazuka y Meidaimae caben justos: es la escala a la que la
     linea Keio deja de ser once pixeles y se ve el ultimo tramo. */
  cerca:  [139.735, 35.674, 0.78],
  /* 🚨 EL ÚLTIMO ENCUADRE DE LA PELÍCULA, el del acto 3: sobre la estación de
     Shinjuku y tan cerca que ya no hay mapa que dibujar. A 0,03° de ancho el
     radio pasa de 490.000 y la costa hace rato que se apagó sola por su propio
     techo (mapa.js, R_INVISIBLE = 26.000). Que no quede nada que dibujar es
     justo lo que se quiere: «zoom, zoom, zoom hasta que el mapa se difumina por
     completo». */
  /* 🚨 EL ENCUADRE DE LA LINEA DEL ACTO 3. El de «cerca» lo heredamos del acto
     2, donde tenia que caber Shinjuku, Sasazuka y Meidaimae; para el acto 3 el
     sujeto es solo Matsubara → Shinjuku, y a 0,78° esa linea mide cincuenta
     pixeles en una esquina. Se vio en la captura: la pelicula se paraba a
     ensenar un garabato. Centrado entre los dos extremos y con sitio para las
     dos etiquetas. */
  keio:     [139.676, 35.6783, 0.17],
  disuelve: [139.6991, 35.6884, 0.03]
};
