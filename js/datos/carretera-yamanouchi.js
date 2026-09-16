/* La ruta de Kusatsu a Yamanouchi, para el mapa pequenio del acto 6.

   Datos de OpenStreetMap, (c) colaboradores de OpenStreetMap, licencia ODbL.

   🚨 NO SE VA POR DONDE PARECE, Y ESTE ES EL DATO QUE MAS IMPORTA DE TODO
   ESTE ARCHIVO. En linea recta son 19 km. Por la 292 de Shiga Kogen serian
   cuarenta minutos, pero ESA CARRETERA CIERRA EN INVIERNO: sube por encima
   de los 2.000 m por la falda del Shirane y en las fechas de este viaje
   esta cerrada con barreras. Asi que se rodea por el sur y el oeste:
   Kusatsu, Naganohara, Tsumagoi, el paso de Torii, Ueda, Nagano y de ahi
   al noreste hasta Yamanouchi.

   ✅ EL CIERRE, CON FUENTE (consultado el 17 de septiembre de 2026):
     · 国道292号 志賀草津道路, del「天狗山ゲート」(Kusatsu) al 渋峠 en el
       limite con Nagano: 17,9 km cerrados. Temporada 2025-26, del 12 de
       noviembre a las 13:00 al 22 de abril a las 10:00.
       Gobierno de la prefectura de Gunma, Direccion de Carreteras:
       https://www.pref.gunma.jp/page/11074.html
     · 県道66号 豊野南志賀公園線 (la Joshin Skyline, el paso de Yamada), que
       es el OTRO camino por la meseta: del 7 de noviembre al 22 de mayo.
       Cierra aun mas tiempo que la 292.
       https://higashidate.com/info/2025/10/24/2025winterclosureinformation/
     · Y ademas hay restriccion por el volcan: entre 殺生河原 y el cruce de
       Manza (8,5 km) desde el 4 de agosto de 2025, por el nivel 2 de alerta
       del Kusatsu-Shirane.

   ⚠️ LAS FECHAS EXACTAS DE LA TEMPORADA 2026-27 NO ESTAN PUBLICADAS todavia
   —se anuncian en otonio—, pero el cierre va de mediados de noviembre a
   finales de abril todos los anios, asi que las fechas de este viaje (13 dic
   a 10 ene) caen dentro con holgura. Lo que esta ⚠️ es el dia exacto, no el
   hecho. Regla 12: antes de reservar nada, se vuelve a mirar.

   🚨 EL PUERTO ESTA VETADO EN EL BUSCADOR A PROPOSITO. Pesando por tiempo,
   el camino mas rapido se mete por ahi encantado. La caja vetada esta en
   herramientas/generar-carreteras.js (VETO_SHIGA) y cubre la meseta entera
   —Shiga Kogen, Manza y el paso de Yamada— sin tocar Kusatsu ni Yamanouchi.
   El trozo de la 292 que baja de Kusatsu a Naganohara SI se usa, y el de la
   292 del valle de Nagano a Yamanouchi tambien: lo que cierra es el puerto,
   no la carretera entera.

   🚨 Y EL CAMINO SE BUSCA POR ETAPAS, pasando POR Naganohara, Tsumagoi,
   Ueda y Nagano. Comprobarlo despues no bastaba: el buscador encontro dos
   rutas distintas que cumplian los puntos de paso y se iban por puertos
   cerrados. Ver la seccion 3 de la herramienta.

   Se sacaron 39696 vias del corredor
   [138.08, 36.28] - [138.72, 36.82], se cosieron por los
   puntos que comparten y se busco el camino mas rapido entre los dos
   extremos.

   136.5 km de carretera. El extremo de salida se estira 0.02 km
   hasta la carretera mas cercana y el de llegada 0.02 km; a la escala de
   este mapa eso es menos de un pixel.

   134 puntos, simplificados a 0.0009 grados (~100 m).
   Generado por herramientas/generar-carreteras.js el 2026-09-16.
   No se edita a mano. */
export const RUTA_YAMANOUCHI = [[138.5966,36.623],[138.5964,36.6211],[138.5931,36.6208],[138.5932,36.6178],[138.5892,36.613],[138.5843,36.6117],[138.5832,36.6094],[138.5844,36.6081],[138.5837,36.6038],[138.5872,36.6002],[138.5854,36.5956],[138.5874,36.5925],[138.5867,36.5782],[138.5898,36.5763],[138.5987,36.5652],[138.6023,36.5637],[138.6035,36.5603],[138.6105,36.5586],[138.6166,36.5539],[138.6281,36.555],[138.6409,36.5514],[138.6481,36.5462],[138.6434,36.5504],[138.628,36.555],[138.623,36.5537],[138.614,36.5539],[138.6028,36.5478],[138.5965,36.5503],[138.5924,36.5469],[138.587,36.5515],[138.5825,36.5468],[138.579,36.5463],[138.5737,36.5486],[138.5693,36.5444],[138.561,36.5449],[138.5551,36.539],[138.5549,36.5359],[138.5506,36.5316],[138.5431,36.5278],[138.543,36.5243],[138.5407,36.5208],[138.5322,36.5194],[138.5289,36.5153],[138.5181,36.5129],[138.5122,36.5071],[138.5003,36.501],[138.497,36.4952],[138.4882,36.4907],[138.4863,36.487],[138.4831,36.4852],[138.4568,36.4848],[138.4403,36.488],[138.428,36.4854],[138.4161,36.4888],[138.3996,36.4895],[138.396,36.491],[138.3924,36.4897],[138.393,36.4918],[138.3948,36.4925],[138.3887,36.4931],[138.389,36.4964],[138.3782,36.4879],[138.3619,36.4926],[138.3596,36.489],[138.3526,36.4854],[138.3508,36.4807],[138.3459,36.4774],[138.3444,36.4722],[138.34,36.4651],[138.3393,36.4609],[138.3333,36.4562],[138.3279,36.4496],[138.3214,36.4478],[138.2995,36.4356],[138.298,36.4286],[138.2992,36.4208],[138.291,36.4114],[138.2824,36.4089],[138.2684,36.4022],[138.2639,36.403],[138.2545,36.4076],[138.2498,36.3971],[138.2545,36.4076],[138.2639,36.403],[138.2686,36.4023],[138.2802,36.4073],[138.2834,36.4135],[138.2773,36.4195],[138.2525,36.4254],[138.2242,36.4364],[138.2151,36.4426],[138.2046,36.4471],[138.201,36.4521],[138.198,36.4624],[138.1981,36.4698],[138.1962,36.4735],[138.165,36.5042],[138.1463,36.5174],[138.1415,36.5251],[138.1391,36.545],[138.1415,36.5531],[138.1644,36.5589],[138.173,36.5637],[138.1846,36.5647],[138.1968,36.5714],[138.2005,36.5748],[138.1994,36.5773],[138.1889,36.585],[138.1793,36.603],[138.1788,36.6077],[138.1831,36.6283],[138.1819,36.6427],[138.1874,36.6436],[138.1916,36.6492],[138.2199,36.6474],[138.2274,36.6542],[138.246,36.656],[138.2608,36.6621],[138.2674,36.6755],[138.269,36.6934],[138.2737,36.7012],[138.305,36.7215],[138.3065,36.7321],[138.318,36.7325],[138.351,36.7446],[138.3509,36.7531],[138.375,36.7584],[138.3908,36.7586],[138.4025,36.7464],[138.4045,36.742],[138.4132,36.7353],[138.419,36.7351],[138.4203,36.7366],[138.4308,36.7344]];

/* Lo que mide, en kilometros de carretera de verdad. Sale de la geometria.
   Lo que se TARDA no sale de aqui: 132 min es a velocidad libre de
   catalogo y sin trafico, y este viaje se hace en Anio Nuevo subiendo a la
   nieve. Si se ensenia, se ensenia marcado. */
export const KM_YAMANOUCHI = 136;
export const MIN_YAMANOUCHI_LIBRE = 132;
