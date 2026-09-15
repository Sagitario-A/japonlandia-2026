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

  /* ------------------------------------------------------------------ *
   * 1 · Tema
   * ------------------------------------------------------------------ */
  var botonTema = document.getElementById('tema');

  function temaActual() {
    var puesto = raiz.getAttribute('data-tema');
    if (puesto) return puesto;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  }
  function pintarBotonTema() {
    if (!botonTema) return;
    var siguiente = temaActual() === 'oscuro' ? 'claro' : 'oscuro';
    botonTema.setAttribute('aria-label', 'Cambiar a tema ' + siguiente);
  }
  if (botonTema) {
    botonTema.addEventListener('click', function () {
      var siguiente = temaActual() === 'oscuro' ? 'claro' : 'oscuro';
      raiz.setAttribute('data-tema', siguiente);
      try { localStorage.setItem('tema', siguiente); } catch (e) {}
      pintarBotonTema();
    });
    pintarBotonTema();
  }

  /* ------------------------------------------------------------------ *
   * 2 · El globo — proyección ortográfica de verdad
   * ------------------------------------------------------------------ */
  var R = 100;
  var RAD = Math.PI / 180;

  /* Costas esquemáticas, en grados [lon, lat]. Coarse a propósito: a este
     tamaño un grado es medio píxel. Cada array es un contorno cerrado. */
  var TIERRAS = [
    /* Eurasia */[-9,37,-9,43,-2,43,-1,46,-4,48,1,50,4,52,8,55,10,57,8,58,5,59,6,62,11,64,14,67,18,69,22,70,28,71,33,70,41,68,50,69,60,71,70,73,78,73,90,76,105,77,113,74,125,73,136,72,145,70,155,71,165,69,178,65,170,61,163,60,158,57,150,59,143,54,140,46,133,43,131,45,128,40,124,40,122,31,119,25,110,21,108,16,106,10,104,2,100,6,98,16,94,16,90,22,87,21,81,16,80,9,77,8,73,15,70,21,67,24,61,25,57,23,54,17,45,13,39,17,37,22,34,28,34,31,30,36,27,40,23,40,20,42,18,40,16,38,12,38,11,42,10,44,7,44,3,43,0,40,-2,37,-6,36],
    /* África */[-6,36,-9,32,-13,28,-16,22,-17,15,-14,11,-8,5,0,5,9,4,9,0,12,-5,13,-12,15,-23,18,-32,22,-34,27,-33,32,-29,35,-24,40,-16,40,-11,42,-2,44,5,51,12,43,13,39,17,37,22,34,28,32,31,25,32,20,31,11,34,3,37,-2,36],
    /* Islas británicas */[-5,50,-3,51,1,51,0,53,-1,55,-3,58,-5,58,-6,56,-5,54,-3,53,-5,52],
    /* Japón */[130,32,132,34,135,34,137,35,140,36,141,39,141,41,140,42,143,42,145,43,144,45,141,45,140,41,139,38,137,37,133,35,131,34,130,33],
    /* Groenlandia */[-45,60,-50,64,-53,68,-58,72,-55,77,-40,82,-20,80,-22,72,-32,68,-42,62],
    /* América del Norte, borde este */[-55,52,-60,47,-67,45,-74,40,-76,35,-81,31,-80,25,-83,28,-90,29,-97,26,-90,21,-86,21,-84,10,-77,8,-79,15,-75,20,-70,19,-64,18,-70,25,-79,27,-81,32,-76,37,-70,42,-62,46],
    /* América del Sur */[-77,8,-72,11,-62,10,-52,5,-50,0,-44,-2,-38,-5,-35,-8,-39,-13,-41,-21,-48,-25,-53,-34,-57,-38,-62,-40,-65,-45,-69,-52,-73,-52,-75,-45,-71,-33,-70,-18,-76,-14,-81,-6,-80,-2,-79,2],
    /* Australia */[113,-22,114,-34,118,-35,129,-32,137,-35,141,-38,147,-38,150,-35,153,-28,146,-19,142,-11,136,-12,130,-12,126,-14,122,-17]
  ];

  var MADRID = [-3.7, 40.4];
  var NARITA = [140.4, 35.8];

  var lon0 = -15, lat0 = 18;   /* centro de la vista, en grados */

  function proyectar(lon, lat) {
    var l = (lon - lon0) * RAD, f = lat * RAD, f0 = lat0 * RAD;
    var cosc = Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l);
    if (cosc < 0) return null;                     /* está en la cara oculta */
    return [
      R * Math.cos(f) * Math.sin(l),
      -R * (Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l))
    ];
  }

  /* Convierte una lista de [lon,lat] en path, cortando por el borde visible */
  function trazar(pares, cerrar) {
    var d = '', abierto = false, i, p;
    for (i = 0; i < pares.length; i += 2) {
      p = proyectar(pares[i], pares[i + 1]);
      if (p) {
        d += (abierto ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
        abierto = true;
      } else if (abierto) {
        if (cerrar) d += 'Z';
        abierto = false;
      }
    }
    if (abierto && cerrar) d += 'Z';
    return d;
  }

  /* Retícula: meridianos cada 30° y paralelos cada 30° */
  var RETICULA = (function () {
    var lineas = [], lon, lat, puntos;
    for (lon = -180; lon < 180; lon += 30) {
      puntos = [];
      for (lat = -70; lat <= 70; lat += 10) puntos.push(lon, lat);
      lineas.push(puntos);
    }
    for (lat = -60; lat <= 60; lat += 30) {
      puntos = [];
      for (lon = -180; lon <= 180; lon += 10) puntos.push(lon, lat);
      lineas.push(puntos);
    }
    return lineas;
  })();

  /* Círculo máximo entre dos puntos: la ruta real, no un arco inventado */
  var RUTA = (function () {
    var a = [MADRID[0] * RAD, MADRID[1] * RAD], b = [NARITA[0] * RAD, NARITA[1] * RAD];
    var ax = Math.cos(a[1]) * Math.cos(a[0]), ay = Math.cos(a[1]) * Math.sin(a[0]), az = Math.sin(a[1]);
    var bx = Math.cos(b[1]) * Math.cos(b[0]), by = Math.cos(b[1]) * Math.sin(b[0]), bz = Math.sin(b[1]);
    var d = Math.acos(Math.max(-1, Math.min(1, ax * bx + ay * by + az * bz)));
    var pasos = 72, salida = [], i, t, s1, s2, x, y, z;
    for (i = 0; i <= pasos; i++) {
      t = i / pasos;
      s1 = Math.sin((1 - t) * d) / Math.sin(d);
      s2 = Math.sin(t * d) / Math.sin(d);
      x = s1 * ax + s2 * bx; y = s1 * ay + s2 * by; z = s1 * az + s2 * bz;
      salida.push(Math.atan2(y, x) / RAD, Math.atan2(z, Math.sqrt(x * x + y * y)) / RAD);
    }
    return salida;
  })();

  var elGlobo  = document.getElementById('globo');
  var elRetic  = document.getElementById('retic');
  var elTierra = document.getElementById('tierra');
  var elRuta   = document.getElementById('ruta');
  var elAvion  = document.getElementById('avion');
  var elMad    = document.getElementById('hito-mad');
  var elNrt    = document.getElementById('hito-nrt');

  function dibujarGlobo(avance) {
    if (!elRetic) return;

    var d = '', i;
    for (i = 0; i < RETICULA.length; i++) d += trazar(RETICULA[i], false);
    elRetic.setAttribute('d', d);

    d = '';
    for (i = 0; i < TIERRAS.length; i++) d += trazar(TIERRAS[i], true);
    elTierra.setAttribute('d', d);

    /* La ruta se dibuja solo hasta donde ha llegado el avión */
    var hasta = Math.max(2, Math.round((RUTA.length / 2) * avance) * 2);
    elRuta.setAttribute('d', trazar(RUTA.slice(0, hasta), false));

    /* El avión, en la cabeza de la ruta y girado hacia donde va */
    var j = Math.max(2, hasta - 2);
    var actual = proyectar(RUTA[j], RUTA[j + 1]);
    var previo = proyectar(RUTA[j - 2], RUTA[j - 1]);
    if (actual && previo) {
      var ang = Math.atan2(actual[1] - previo[1], actual[0] - previo[0]) / RAD + 90;
      elAvion.setAttribute('transform',
        'translate(' + actual[0].toFixed(1) + ' ' + actual[1].toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
      elAvion.style.opacity = avance > 0.01 && avance < 0.995 ? '1' : '0';
    } else {
      elAvion.style.opacity = '0';
    }

    situarHito(elMad, MADRID);
    situarHito(elNrt, NARITA);
  }

  function situarHito(el, punto) {
    if (!el) return;
    var p = proyectar(punto[0], punto[1]);
    if (p) {
      el.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')');
      el.style.opacity = '1';
    } else {
      el.style.opacity = '0';
    }
  }

  /* ------------------------------------------------------------------ *
   * 3 · La intro, atada al scroll
   * ------------------------------------------------------------------ */
  var elIntro  = document.getElementById('intro');
  var elEscena = elIntro ? elIntro.querySelector('.escena') : null;
  var elBarra  = document.getElementById('barra');
  var elRail   = document.getElementById('rail');

  function tope(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function tramo(v, a, b) { return tope((v - a) / (b - a)); }
  function suave(t) { return t * t * (3 - 2 * t); }

  function pintarIntro(p) {
    var pTitulo  = 1 - suave(tramo(p, 0.00, 0.16));
    var pGlobo   = suave(tramo(p, 0.05, 0.28));
    var pVuelo   = suave(tramo(p, 0.20, 0.76));
    var pSubida  = suave(tramo(p, 0.78, 1.00));
    var pPista   = 1 - suave(tramo(p, 0.00, 0.10));

    lon0 = -15 + pVuelo * 130;
    lat0 = 18 + pVuelo * 34;
    dibujarGlobo(pVuelo);

    var e = elEscena.style;
    e.setProperty('--p-titulo', pTitulo.toFixed(3));
    e.setProperty('--p-globo', (pGlobo * (1 - pSubida * 0.92)).toFixed(3));
    e.setProperty('--p-globo-escala', pGlobo.toFixed(3));
    e.setProperty('--p-subida', pSubida.toFixed(3));
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
      /* Cuánto lleva recorrido este capítulo por la pantalla, de 0 a 1 */
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
   * 5 · Saltar la intro, y recordarlo
   * ------------------------------------------------------------------ */
  var botonSaltar = document.getElementById('saltar-intro');
  if (botonSaltar) {
    botonSaltar.addEventListener('click', function () {
      try { localStorage.setItem('intro-vista', 'si'); } catch (e) {}
      var destino = document.getElementById('capitulos');
      if (destino) destino.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth' });
    });
  }
  if (raiz.classList.contains('intro-vista')) raiz.classList.add('intro-corta');

  /* ------------------------------------------------------------------ *
   * 6 · El bucle: un solo listener de scroll que escribe en un rAF
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
   * 7 · Arranque
   * ------------------------------------------------------------------ */
  raiz.classList.add('anim');   /* a partir de aquí el CSS puede animar */

  if (sinMovimiento) {
    /* Sin movimiento: el fotograma final y a leer. Ni scroll ni rAF. */
    lon0 = 60; lat0 = 40;
    dibujarGlobo(1);
    if (elEscena) {
      elEscena.style.setProperty('--p-globo', '0.22');
      elEscena.style.setProperty('--p-globo-escala', '1');
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
