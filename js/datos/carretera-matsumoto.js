/* La ruta de Yamanouchi a la estacion de Matsumoto, para el final del acto 6.

   Datos de OpenStreetMap, (c) colaboradores de OpenStreetMap, licencia ODbL.

   Es donde se deja el coche y se coge el tren a Kioto, asi que la linea
   acaba en la ESTACION y no en el centro del pueblo. Se baja de Yamanouchi
   al valle, se pasa por Nagano y se sigue al sur.

   Se sacaron 61611 vias del corredor
   [137.82, 36.14] - [138.52, 36.82], se cosieron por los
   puntos que comparten y se busco el camino mas rapido entre los dos
   extremos.

   98.9 km de carretera. El extremo de salida se estira 0.02 km
   hasta la carretera mas cercana y el de llegada 0.08 km; a la escala de
   este mapa eso es menos de un pixel.

   78 puntos, simplificados a 0.0009 grados (~100 m).
   Generado por herramientas/generar-carreteras.js el 2026-09-16.
   No se edita a mano. */
export const RUTA_MATSUMOTO = [[138.4308,36.7344],[138.4203,36.7366],[138.419,36.7351],[138.4132,36.7353],[138.4045,36.742],[138.4025,36.7464],[138.3908,36.7586],[138.375,36.7584],[138.3509,36.7531],[138.351,36.7446],[138.318,36.7325],[138.3065,36.7321],[138.305,36.7215],[138.2737,36.7012],[138.269,36.6934],[138.2674,36.6755],[138.2608,36.6621],[138.246,36.656],[138.2274,36.6542],[138.2199,36.6474],[138.1916,36.6492],[138.1874,36.6436],[138.1819,36.6427],[138.1831,36.6283],[138.1788,36.6077],[138.1793,36.603],[138.1889,36.585],[138.1977,36.5777],[138.1993,36.5778],[138.2017,36.5739],[138.1843,36.5645],[138.1731,36.5636],[138.1644,36.5584],[138.1402,36.5524],[138.1299,36.5525],[138.1165,36.5581],[138.0996,36.5503],[138.0965,36.5391],[138.08,36.527],[138.0716,36.5157],[138.074,36.5118],[138.0871,36.5065],[138.0927,36.5022],[138.0999,36.4921],[138.0991,36.4877],[138.0947,36.4835],[138.0689,36.4669],[138.0596,36.4551],[138.0474,36.4526],[138.0378,36.4405],[138.0321,36.439],[138.0271,36.4356],[138.0176,36.4361],[138.0126,36.4337],[138.0076,36.4211],[138.0017,36.4123],[138.0008,36.4038],[138.0028,36.3968],[138.0015,36.3899],[137.9871,36.3594],[137.9829,36.3565],[137.969,36.3521],[137.9602,36.3449],[137.9538,36.3437],[137.945,36.3364],[137.9338,36.33],[137.9262,36.3276],[137.9228,36.3231],[137.9207,36.3177],[137.9208,36.3113],[137.9311,36.2818],[137.931,36.2709],[137.9349,36.2615],[137.9384,36.2349],[137.9402,36.2335],[137.9408,36.2306],[137.9635,36.2332],[137.9651,36.231]];

/* Lo que mide, en kilometros de carretera de verdad. Sale de la geometria.
   Lo que se TARDA no sale de aqui: 85 min es a velocidad libre de
   catalogo y sin trafico, y este viaje se hace en Anio Nuevo subiendo a la
   nieve. Si se ensenia, se ensenia marcado. */
export const KM_MATSUMOTO = 99;
export const MIN_MATSUMOTO_LIBRE = 85;
