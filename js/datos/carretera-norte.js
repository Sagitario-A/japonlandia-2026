/* La ruta de Tokio a Takaragawa, para el mapa pequenio del acto 3.

   Datos de OpenStreetMap, (c) colaboradores de OpenStreetMap, licencia ODbL.

   Es el EJE REAL de la autopista Kan-Etsu (E17, 関越自動車道), sacado de
   636 vias de OSM repartidas en 70 franjas de latitud y promediadas:
   asi se juntan las dos calzadas, que van separadas treinta metros y a esta
   escala son la misma linea. De 35.754 a 36.720 de latitud.

   Lo que NO sale de aqui, y hay que saberlo:
     - El tramo urbano Shinjuku - entrada de la autopista lo pone rutas.js
       uniendo dos puntos reales. Son doce kilometros de ciudad que a la
       escala de este mapa miden dos pixeles.
     - El ultimo tramo, de Minakami a Takaragawa, igual: veinte kilometros
       de carretera de montania que aqui son tres pixeles.
   Los dos extremos SI son coordenadas verificadas (rutas.js, LUGARES).

   70 puntos. Generado por herramientas/generar-carreteras.js el 2026-09-16.
   No se edita a mano. */
export const EJE_KANETSU = [[139.5926,35.7613],[139.568,35.7751],[139.5501,35.7889],[139.5363,35.8027],[139.5235,35.8165],[139.5092,35.8303],[139.5028,35.8441],[139.4944,35.8579],[139.4823,35.8716],[139.4686,35.8854],[139.4563,35.8992],[139.4338,35.913],[139.4111,35.9268],[139.4013,35.9406],[139.3873,35.9544],[139.3806,35.9682],[139.3807,35.982],[139.387,35.9958],[139.3861,36.0096],[139.3819,36.0234],[139.372,36.0372],[139.3458,36.0509],[139.318,36.0647],[139.2987,36.0785],[139.2876,36.0923],[139.2757,36.1061],[139.2549,36.1199],[139.232,36.1337],[139.221,36.1475],[139.2078,36.1613],[139.1935,36.1751],[139.1894,36.1889],[139.179,36.2027],[139.165,36.2165],[139.1522,36.2302],[139.1409,36.244],[139.1081,36.2578],[139.0966,36.2716],[139.0972,36.2854],[139.0954,36.2992],[139.0859,36.313],[139.0692,36.3268],[139.0564,36.3406],[139.0415,36.3544],[139.0306,36.3682],[139.027,36.382],[139.0252,36.3958],[139.0224,36.4095],[139.0169,36.4233],[139.0146,36.4371],[139.0146,36.4509],[139.0121,36.4647],[139.0191,36.4785],[139.0306,36.4923],[139.0319,36.5061],[139.0373,36.5199],[139.0465,36.5337],[139.0528,36.5475],[139.0604,36.5613],[139.0623,36.575],[139.066,36.5888],[139.0632,36.6026],[139.0673,36.6164],[139.071,36.6302],[139.0784,36.644],[139.0702,36.6578],[139.0397,36.6716],[139.0039,36.6854],[138.9894,36.6992],[138.9782,36.713]];
