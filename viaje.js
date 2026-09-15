/* ==========================================================================
   Viaje a Japón 2026 · viaje.js
   --------------------------------------------------------------------------
   REGLA DE ORO (NORMAS § 11.2): este archivo ANIMA, no escribe contenido.
   Si no carga, no se ejecuta o falla, la página se lee entera igual.
   Por eso la clase 'anim' se pone AQUÍ y no en el <head>: todo lo que el CSS
   esconde a la espera de una animación depende de que este archivo esté vivo.
   ========================================================================== */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var RAD = Math.PI / 180;
  var R = 100;

  /* ------------------------------------------------------------------ *
   * 1 · Geometría del globo
   *
   * Cada punto se convierte UNA VEZ en un vector unitario de la esfera.
   * Girar el globo es entonces multiplicar y sumar: ni un seno ni un
   * coseno por punto y por fotograma. Con 2.355 puntos de costa, esa es
   * la diferencia entre ir suave en un móvil y no ir.
   * ------------------------------------------------------------------ */
  function aVectores(pares) {
    var n = pares.length / 2;
    var v = new Float64Array(n * 3);
    for (var i = 0; i < n; i++) {
      var lon = pares[i * 2] * RAD, lat = pares[i * 2 + 1] * RAD;
      var cl = Math.cos(lat);
      v[i * 3] = cl * Math.cos(lon);
      v[i * 3 + 1] = cl * Math.sin(lon);
      v[i * 3 + 2] = Math.sin(lat);
    }
    return v;
  }

  /* Vista actual: hacia dónde mira la cámara */
  var cosL = 1, sinL = 0, cosF = 1, sinF = 0;
  function mirarA(lon0, lat0) {
    cosL = Math.cos(lon0 * RAD); sinL = Math.sin(lon0 * RAD);
    cosF = Math.cos(lat0 * RAD); sinF = Math.sin(lat0 * RAD);
  }

  /* Proyección ortográfica de un vector ya girado. Devuelve false si el
     punto cae en la cara oculta del planeta. */
  var px = 0, py = 0;
  function proyectarVector(x, y, z) {
    var x1 = x * cosL + y * sinL;
    var y1 = y * cosL - x * sinL;
    var x2 = x1 * cosF + z * sinF;
    if (x2 <= 0) return false;                  /* está al otro lado */
    px = R * y1;
    py = -R * (z * cosF - x1 * sinF);
    return true;
  }

  /* SALTO: ningún tramo de costa real cruza media esfera de una vez. Si pasa,
     es un contorno que da la vuelta por el antimeridiano y se cerraría con una
     raya recta atravesando el planeta. Se corta el trazo y a otra cosa. */
  var SALTO2 = 100 * 100;

  function trazar(v, cerrar, hasta) {
    var fin = hasta === undefined ? v.length : hasta;
    var d = '', abierto = false, ux = 0, uy = 0;
    for (var i = 0; i < fin; i += 3) {
      if (proyectarVector(v[i], v[i + 1], v[i + 2])) {
        var salta = abierto && ((px - ux) * (px - ux) + (py - uy) * (py - uy)) > SALTO2;
        if (salta && cerrar) d += 'Z';
        d += (abierto && !salta ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1);
        abierto = true;
        ux = px; uy = py;
      } else if (abierto) {
        if (cerrar) d += 'Z';
        abierto = false;
      }
    }
    if (abierto && cerrar) d += 'Z';
    return d;
  }

  /* Costas reales, de tierra.js. Si ese archivo no cargara, el globo sigue
     saliendo con su retícula y su ruta: se pierde el mapa, no la página. */
  var TIERRA = (window.TIERRA || []).map(aVectores);

  /* Retícula: meridianos cada 30°, paralelos cada 30° */
  var RETICULA = (function () {
    var lineas = [], lon, lat, p;
    for (lon = -180; lon < 180; lon += 30) {
      p = [];
      for (lat = -70; lat <= 70; lat += 10) p.push(lon, lat);
      lineas.push(aVectores(p));
    }
    for (lat = -60; lat <= 60; lat += 30) {
      p = [];
      for (lon = -180; lon <= 180; lon += 10) p.push(lon, lat);
      lineas.push(aVectores(p));
    }
    return lineas;
  })();

  /* ------------------------------------------------------------------ *
   * 2 · La ruta real de Iberia — NO es la línea recta del mapa
   *
   * Con el espacio aéreo ruso cerrado, la ida evita Rusia entera: sale por
   * el Mediterráneo, cruza Turquía y el Cáucaso, sigue por Kazajistán y
   * China y entra en Japón por el mar. Verificado el 15 de septiembre de
   * 2026 → investigacion/020-los-vuelos.md
   * ------------------------------------------------------------------ */
  var MADRID = [-3.7, 40.4];
  var NARITA = [140.4, 35.8];

  var PASOS = [
    [-3.7, 40.4],   /* Madrid */
    [0.5, 41.2],    /* costa catalana */
    [8.5, 40.5],    /* entre Córcega y Cerdeña */
    [15.5, 39.5],   /* sur de Italia */
    [21.5, 38.5],   /* Grecia */
    [27.5, 38.0],   /* mar Egeo */
    [33.0, 38.5],   /* Anatolia */
    [40.0, 40.0],   /* este de Turquía */
    [46.0, 41.0],   /* Cáucaso */
    [51.0, 42.5],   /* mar Caspio */
    [58.0, 44.0],   /* Kazajistán, mar de Aral */
    [66.0, 45.0],   /* Kazajistán */
    [74.0, 44.5],   /* Kazajistán, hacia Xinjiang */
    [82.0, 44.0],   /* Xinjiang */
    [90.0, 43.5],   /* China */
    [98.0, 42.5],   /* China */
    [106.0, 41.5],  /* China */
    [114.0, 40.5],  /* China, cerca de Pekín */
    [121.0, 39.0],  /* mar de Bohai */
    [127.5, 37.5],  /* península de Corea */
    [133.0, 36.5],  /* mar de Japón */
    [138.0, 36.0],  /* Honshu */
    [140.4, 35.8]   /* Narita */
  ];

  /* Une los puntos de paso por el arco de círculo máximo de cada tramo,
     que es como se vuela de verdad entre dos puntos. */
  var RUTA = (function () {
    var pares = [], i, j, t;
    for (i = 0; i < PASOS.length - 1; i++) {
      var a = PASOS[i], b = PASOS[i + 1];
      var la = a[0] * RAD, fa = a[1] * RAD, lb = b[0] * RAD, fb = b[1] * RAD;
      var ax = Math.cos(fa) * Math.cos(la), ay = Math.cos(fa) * Math.sin(la), az = Math.sin(fa);
      var bx = Math.cos(fb) * Math.cos(lb), by = Math.cos(fb) * Math.sin(lb), bz = Math.sin(fb);
      var d = Math.acos(Math.max(-1, Math.min(1, ax * bx + ay * by + az * bz)));
      var n = Math.max(2, Math.round(d / RAD / 2));
      for (j = 0; j < n; j++) {
        t = j / n;
        var s1 = d < 1e-6 ? 1 - t : Math.sin((1 - t) * d) / Math.sin(d);
        var s2 = d < 1e-6 ? t : Math.sin(t * d) / Math.sin(d);
        var x = s1 * ax + s2 * bx, y = s1 * ay + s2 * by, z = s1 * az + s2 * bz;
        pares.push(Math.atan2(y, x) / RAD, Math.atan2(z, Math.sqrt(x * x + y * y)) / RAD);
      }
    }
    pares.push(NARITA[0], NARITA[1]);
    return aVectores(pares);
  })();

  var V_MAD = aVectores(MADRID);
  var V_NRT = aVectores(NARITA);

  var elRetic = document.getElementById('retic');
  var elTierra = document.getElementById('tierra');
  var elRuta = document.getElementById('ruta');
  var elAvion = document.getElementById('avion');
  var elMad = document.getElementById('hito-mad');
  var elNrt = document.getElementById('hito-nrt');

  function dibujarGlobo(avance) {
    if (!elRetic) return;
    var d = '', i;

    for (i = 0; i < RETICULA.length; i++) d += trazar(RETICULA[i], false);
    elRetic.setAttribute('d', d);

    d = '';
    /* Sin cerrar: cerrar un contorno recortado por el borde del globo dibuja
       una cuerda recta que lo atraviesa. Las costas son trazo, no mancha. */
    for (i = 0; i < TIERRA.length; i++) d += trazar(TIERRA[i], false);
    elTierra.setAttribute('d', d);

    /* La ruta, solo hasta donde ha llegado el avión */
    var total = RUTA.length / 3;
    var n = Math.max(2, Math.round(total * avance));
    elRuta.setAttribute('d', trazar(RUTA, false, n * 3));

    /* El avión, en la cabeza de la línea y girado hacia donde va */
    var ok2 = proyectarVector(RUTA[(n - 1) * 3], RUTA[(n - 1) * 3 + 1], RUTA[(n - 1) * 3 + 2]);
    var x2 = px, y2 = py;
    var ok1 = proyectarVector(RUTA[(n - 2) * 3], RUTA[(n - 2) * 3 + 1], RUTA[(n - 2) * 3 + 2]);
    if (ok1 && ok2 && avance > 0.015 && avance < 0.995) {
      var ang = Math.atan2(y2 - py, x2 - px) / RAD + 90;
      elAvion.setAttribute('transform',
        'translate(' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
      elAvion.style.opacity = '1';
    } else {
      elAvion.style.opacity = '0';
    }

    situarHito(elMad, V_MAD);
    situarHito(elNrt, V_NRT);
  }

  function situarHito(el, v) {
    if (!el) return;
    if (proyectarVector(v[0], v[1], v[2])) {
      el.setAttribute('transform', 'translate(' + px.toFixed(1) + ' ' + py.toFixed(1) + ')');
      el.style.opacity = '1';
    } else {
      el.style.opacity = '0';
    }
  }

  /* ------------------------------------------------------------------ *
   * 3 · La intro, atada al scroll
   *
   * La Tierra no espera a que el título se vaya: sube desde abajo DESDE EL
   * PRIMER PÍXEL de scroll, por detrás del título, y los dos se cruzan.
   * ------------------------------------------------------------------ */
  var elIntro = document.getElementById('intro');
  var elEscena = elIntro ? elIntro.querySelector('.escena') : null;
  var elBarra = document.getElementById('barra');
  var elRail = document.getElementById('rail');

  function tope(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function tramo(v, a, b) { return tope((v - a) / (b - a)); }
  function suave(t) { return t * t * (3 - 2 * t); }

  function pintarIntro(p) {
    var pEntrada = suave(tramo(p, 0.00, 0.30));   /* la Tierra subiendo */
    var pTitulo = 1 - suave(tramo(p, 0.06, 0.26));
    var pVuelo = suave(tramo(p, 0.30, 0.80));
    var pSalida = suave(tramo(p, 0.80, 1.00));
    var pPista = 1 - suave(tramo(p, 0.00, 0.10));

    mirarA(-14 + pVuelo * 128, 22 + pVuelo * 20);
    dibujarGlobo(pVuelo);

    var e = elEscena.style;
    e.setProperty('--p-entrada', pEntrada.toFixed(3));
    e.setProperty('--p-titulo', pTitulo.toFixed(3));
    e.setProperty('--p-globo', (pEntrada * (1 - pSalida * 0.95)).toFixed(3));
    e.setProperty('--p-salida', pSalida.toFixed(3));
    e.setProperty('--p-pista', pPista.toFixed(3));

    if (elBarra) elBarra.classList.toggle('visible', p > 0.9);
    if (elRail) elRail.classList.toggle('visible', p > 0.9);
  }

  /* ------------------------------------------------------------------ *
   * 4 · Capítulos: aparición, raíl y ambientación
   * ------------------------------------------------------------------ */
  var capitulos = [].slice.call(document.querySelectorAll('.cap'));
  var enlacesRail = [].slice.call(document.querySelectorAll('.rail a'));

  function pintarCapitulos() {
    var alto = window.innerHeight;
    for (var i = 0; i < capitulos.length; i++) {
      var caja = capitulos[i].getBoundingClientRect();
      var p = tope((alto - caja.top) / (alto * 0.75));
      capitulos[i].style.setProperty('--p-cap', p.toFixed(3));
    }
  }

  /* La pagoda se dibuja sola: el CSS usa --len y --p-cap */
  (function prepararPagoda() {
    var trazos = document.querySelectorAll('.ambiente-kioto .pagoda path');
    for (var i = 0; i < trazos.length; i++) {
      try {
        trazos[i].style.setProperty('--len', trazos[i].getTotalLength().toFixed(1));
      } catch (e) {}
    }
  })();

  if ('IntersectionObserver' in window) {
    var vigia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) entrada.target.classList.add('dentro');
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    capitulos.forEach(function (c) { vigia.observe(c); });

    var vigiaRail = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        var id = entrada.target.id;
        enlacesRail.forEach(function (a) {
          a.setAttribute('aria-current', a.getAttribute('data-rail') === id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    capitulos.forEach(function (c) { vigiaRail.observe(c); });
  } else {
    capitulos.forEach(function (c) { c.classList.add('dentro'); });
  }

  /* ------------------------------------------------------------------ *
   * 5 · El bucle: un solo listener de scroll que escribe en un rAF
   * ------------------------------------------------------------------ */
  var pendiente = false;

  function alHacerScroll() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () {
      pendiente = false;
      if (elIntro && elEscena) {
        var caja = elIntro.getBoundingClientRect();
        var recorrido = Math.max(1, caja.height - window.innerHeight);
        pintarIntro(tope(-caja.top / recorrido));
      }
      pintarCapitulos();
      if (elBarra) elBarra.classList.toggle('posada', window.scrollY > 8);
    });
  }

  /* ------------------------------------------------------------------ *
   * 6 · Arranque
   * ------------------------------------------------------------------ */
  raiz.classList.add('anim');   /* a partir de aquí el CSS puede animar */

  if (sinMovimiento) {
    /* Sin movimiento: el fotograma final y a leer. Ni scroll ni rAF. */
    mirarA(58, 42);
    dibujarGlobo(1);
    if (elEscena) {
      elEscena.style.setProperty('--p-entrada', '1');
      elEscena.style.setProperty('--p-globo', '0.22');
      elEscena.style.setProperty('--p-pista', '0');
    }
    if (elBarra) elBarra.classList.add('visible');
    if (elRail) elRail.classList.add('visible');
    capitulos.forEach(function (c) { c.style.setProperty('--p-cap', '1'); });
  } else {
    window.addEventListener('scroll', alHacerScroll, { passive: true });
    window.addEventListener('resize', alHacerScroll, { passive: true });
    alHacerScroll();
  }
})();
