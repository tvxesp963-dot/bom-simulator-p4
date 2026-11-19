/* ============================================================================
   PULP TRAY — BOM Simulator P4
   Pestaña nueva "🧻 Pulp Tray". Sube el Forecast (Excel) y te dice cuánto Pulp Tray se ocupa por semana,
   restando lo ya producido (ShipQR) y el inventario de IMS P4.
   - Usa el BOM que ya está cargado en el simulador (no lee otro BOM).
   - NO cambia tu plan, targets ni lo publicado al piso. No guarda nada en Firebase.
   - Lecturas de Firestore: usa el mismo caché de "Producido" del simulador (20 min).
   ES / EN / KO (comparte el idioma del Autochequeo).
   ============================================================================ */
(function () {
  'use strict';
  if (window.__pulpTrayCargado) return;
  window.__pulpTrayCargado = true;

  var T = {
    es: {
      btn: '🧻 Pulp Tray', titulo: '🧻 Requerimiento de Pulp Tray según Forecast',
      pasos: '1) Carga el Excel del Forecast  →  2) Revisa cuánto falta  →  3) Descarga el Excel. Esto es solo un cálculo: no cambia tu plan ni lo publicado al piso.',
      cargar: '📂 Cargar Forecast (Excel)', recalc: '🔄 Recalcular con datos actuales', excel: '⬇ Excel', cerrar: '✕ Cerrar',
      archivo: 'Forecast', ims: 'Inventario IMS P4', nunca: 'sin sincronizar — presiona "Sync IMS" arriba y luego Recalcular',
      hace: function (m) { return 'actualizado hace ' + m + ' min'; },
      descBottom: 'Restar también el Bottom (Lower Box) ya fabricado en IMS',
      descBottomAyuda: 'El Bottom terminado ya trae su Pulp Tray adentro. Actívalo si quieres no contar esas piezas.',
      cReq: 'Pulp Tray requerido', cReqS: 'Forecast − producido', cInv: 'Inventario IMS P4', cFalta: 'Falta', cFaltaS: 'Requerido − inventario', cPedir: 'Pedir sugerido', cPedirS: 'con margen (+10% / +1% si pasa de 100,000)',
      rFc: 'Forecast (pzas de modelo)', rProd: '(−) Ya producido', rBot: '(−) Bottom ya hecho', rNet: 'Pulp Tray requerido', rSaldo: 'Saldo con inventario', rPedir: 'Pedir esta semana', total: 'Total',
      inv: 'Inventario', usadoEn: 'Se usa en', semana: 'S',
      ok: '✓ Alcanza', falta: '✗ Falta',
      sinBomT: '⚠ Códigos del Forecast que NO se encontraron en el BOM cargado',
      sinBomA: 'Elige a qué modelo del BOM corresponde cada uno (se recuerda en este navegador). Mientras no lo elijas, NO se cuentan.',
      elige: '— elegir modelo —', sinPulpT: 'ℹ Modelos sin Pulp Tray en su BOM (no se cuentan)', detalleT: 'Ver detalle por modelo',
      cDet: ['Código (Forecast)', 'Descripción', 'Modelo en BOM', 'Pulp Tray', 'Forecast', 'Producido', 'Bottom hecho', 'Requerido'],
      resumen: function (a, b, c, d) { return 'Forecast leído: ' + a + ' códigos con demanda · ' + b + ' con Pulp Tray · ' + c + ' sin Pulp Tray · ' + d + ' sin encontrar en el BOM'; },
      ignorados: function (n) { return n + ' renglones que no son GH90 (ej. Cross Pad) se omitieron.'; },
      sobra: function (s) { return 'Producido mayor al Forecast (sobra): ' + s; },
      prodErr: '⚠ No se pudo leer el Producido de ShipQR: el cálculo salió SIN restar lo producido.',
      prodAmb: '', sinBom: 'Primero carga un BOM en el simulador.', formato: 'No encontré el formato del Forecast (renglón "Row Labels" con semanas y códigos GH90).',
      sinDatos: 'El Forecast no trae códigos GH90 con cantidad.', leyendo: '⏳ Leyendo y calculando...', error: 'No se pudo calcular: ',
      sinPulp: 'Ninguno de los modelos del Forecast tiene Pulp Tray en el BOM cargado.', vacio: 'Carga el Excel del Forecast para empezar.'
    },
    en: {
      btn: '🧻 Pulp Tray', titulo: '🧻 Pulp Tray requirement from Forecast',
      pasos: '1) Load the Forecast Excel  →  2) Check what is missing  →  3) Download the Excel. This is only a calculation: it does not change your plan or what is published to the floor.',
      cargar: '📂 Load Forecast (Excel)', recalc: '🔄 Recalculate with current data', excel: '⬇ Excel', cerrar: '✕ Close',
      archivo: 'Forecast', ims: 'IMS P4 inventory', nunca: 'not synced — press "Sync IMS" above, then Recalculate',
      hace: function (m) { return 'updated ' + m + ' min ago'; },
      descBottom: 'Also subtract Bottom (Lower Box) already built in IMS',
      descBottomAyuda: 'A finished Bottom already contains its Pulp Tray. Turn it on if you do not want to count those pieces.',
      cReq: 'Pulp Tray required', cReqS: 'Forecast − produced', cInv: 'IMS P4 inventory', cFalta: 'Short', cFaltaS: 'Required − inventory', cPedir: 'Suggested order', cPedirS: 'with margin (+10% / +1% above 100,000)',
      rFc: 'Forecast (model units)', rProd: '(−) Already produced', rBot: '(−) Bottom already built', rNet: 'Pulp Tray required', rSaldo: 'Balance with inventory', rPedir: 'Order this week', total: 'Total',
      inv: 'Inventory', usadoEn: 'Used in', semana: 'W',
      ok: '✓ Enough', falta: '✗ Short',
      sinBomT: '⚠ Forecast codes NOT found in the loaded BOM',
      sinBomA: 'Pick which BOM model each one belongs to (remembered in this browser). Until you pick, they are NOT counted.',
      elige: '— pick model —', sinPulpT: 'ℹ Models without Pulp Tray in their BOM (not counted)', detalleT: 'See detail by model',
      cDet: ['Code (Forecast)', 'Description', 'BOM model', 'Pulp Tray', 'Forecast', 'Produced', 'Bottom built', 'Required'],
      resumen: function (a, b, c, d) { return 'Forecast read: ' + a + ' codes with demand · ' + b + ' with Pulp Tray · ' + c + ' without Pulp Tray · ' + d + ' not found in BOM'; },
      ignorados: function (n) { return n + ' rows that are not GH90 (e.g. Cross Pad) were skipped.'; },
      sobra: function (s) { return 'Produced above Forecast (surplus): ' + s; },
      prodErr: '⚠ Could not read Produced from ShipQR: the result was calculated WITHOUT subtracting produced units.',
      prodAmb: '', sinBom: 'Load a BOM in the simulator first.', formato: 'I could not find the Forecast format ("Row Labels" row with weeks and GH90 codes).',
      sinDatos: 'The Forecast has no GH90 codes with quantity.', leyendo: '⏳ Reading and calculating...', error: 'Could not calculate: ',
      sinPulp: 'None of the Forecast models has a Pulp Tray in the loaded BOM.', vacio: 'Load the Forecast Excel to start.'
    },
    ko: {
      btn: '🧻 Pulp Tray', titulo: '🧻 Forecast 기준 Pulp Tray 소요량',
      pasos: '1) Forecast 엑셀 불러오기  →  2) 부족 수량 확인  →  3) 엑셀 다운로드. 계산만 하며 계획이나 현장 게시 내용은 바뀌지 않습니다.',
      cargar: '📂 Forecast 불러오기 (Excel)', recalc: '🔄 최신 데이터로 다시 계산', excel: '⬇ Excel', cerrar: '✕ 닫기',
      archivo: 'Forecast', ims: 'IMS P4 재고', nunca: '동기화 안 됨 — 위의 "Sync IMS"를 누른 후 다시 계산하세요',
      hace: function (m) { return m + '분 전 업데이트'; },
      descBottom: 'IMS에 이미 만들어진 Bottom(Lower Box)도 차감',
      descBottomAyuda: '완성된 Bottom에는 이미 Pulp Tray가 들어 있습니다. 해당 수량을 제외하려면 켜세요.',
      cReq: '필요 Pulp Tray', cReqS: 'Forecast − 생산 완료', cInv: 'IMS P4 재고', cFalta: '부족', cFaltaS: '필요 − 재고', cPedir: '권장 발주', cPedirS: '여유 포함 (+10% / 100,000 초과 시 +1%)',
      rFc: 'Forecast (모델 수량)', rProd: '(−) 이미 생산', rBot: '(−) 이미 만든 Bottom', rNet: '필요 Pulp Tray', rSaldo: '재고 반영 잔량', rPedir: '이번 주 발주', total: '합계',
      inv: '재고', usadoEn: '사용 모델', semana: 'W',
      ok: '✓ 충분', falta: '✗ 부족',
      sinBomT: '⚠ 현재 BOM에서 찾지 못한 Forecast 코드',
      sinBomA: '각 코드가 어느 BOM 모델인지 선택하세요 (이 브라우저에 저장됨). 선택하기 전까지는 계산에 포함되지 않습니다.',
      elige: '— 모델 선택 —', sinPulpT: 'ℹ BOM에 Pulp Tray가 없는 모델 (계산 제외)', detalleT: '모델별 상세 보기',
      cDet: ['코드 (Forecast)', '설명', 'BOM 모델', 'Pulp Tray', 'Forecast', '생산 완료', '만든 Bottom', '필요'],
      resumen: function (a, b, c, d) { return 'Forecast 읽음: 수요 있는 코드 ' + a + '개 · Pulp Tray 있음 ' + b + '개 · Pulp Tray 없음 ' + c + '개 · BOM에서 못 찾음 ' + d + '개'; },
      ignorados: function (n) { return 'GH90이 아닌 ' + n + '개 행(예: Cross Pad)은 제외했습니다.'; },
      sobra: function (s) { return 'Forecast보다 많이 생산됨(초과): ' + s; },
      prodErr: '⚠ ShipQR 생산량을 읽지 못해 생산 완료 수량을 차감하지 않고 계산했습니다.',
      prodAmb: '', sinBom: '먼저 시뮬레이터에 BOM을 불러오세요.', formato: 'Forecast 형식을 찾지 못했습니다 (주차와 GH90 코드가 있는 "Row Labels" 행).',
      sinDatos: 'Forecast에 수량이 있는 GH90 코드가 없습니다.', leyendo: '⏳ 읽는 중...', error: '계산할 수 없습니다: ',
      sinPulp: 'Forecast 모델 중 현재 BOM에 Pulp Tray가 있는 모델이 없습니다.', vacio: 'Forecast 엑셀을 불러와 시작하세요.'
    }
  };

  function lang() { try { var l = localStorage.getItem('autoChkLang'); if (T[l]) return l; } catch (e) {} return 'es'; }
  function t(k) { return T[lang()][k]; }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return Math.round(Number(n) || 0).toLocaleString('en-US'); } // miles con coma
  function norm(s) { return String(s == null ? '' : s).trim().toUpperCase(); }

  var MAPEO_KEY = 'pulpTrayMapeo_p4';
  function leerMapeo() { try { return JSON.parse(localStorage.getItem(MAPEO_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function guardarMapeo(m) { try { localStorage.setItem(MAPEO_KEY, JSON.stringify(m)); } catch (e) {} }

  var S = { fc: null, nombre: '', prod: null, prodOk: true, desc: false, res: null, ocupado: false };

  // ============================ LECTURA DEL FORECAST ============================
  // Formato esperado: renglón con "Row Labels" y semanas (47,48,...,53,1,2,...) en columnas; códigos GH90-xxxxx en la 1a columna.
  function leerForecast(wb) {
    var hoja = null, aoa = null, h = -1;
    for (var i = 0; i < wb.SheetNames.length && h < 0; i++) {
      var ws = wb.Sheets[wb.SheetNames[i]];
      var a = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
      for (var r = 0; r < Math.min(a.length, 30); r++) {
        if (norm(a[r] && a[r][0]) === 'ROW LABELS') { hoja = ws; aoa = a; h = r; break; }
      }
    }
    if (h < 0) return null;
    var enc = aoa[h], cols = [], semanas = [];
    var arrancó = false;
    for (var c = 1; c < enc.length; c++) {
      var v = enc[c];
      var esSemana = typeof v === 'number' && v >= 1 && v <= 53 && Math.floor(v) === v;
      if (esSemana) { arrancó = true; cols.push(c); semanas.push(v); }
      else if (arrancó) break; // terminan las semanas (ej. "Total")
    }
    if (!cols.length) return null;
    var filas = [], omitidos = 0;
    for (var r2 = h + 1; r2 < aoa.length; r2++) {
      var row = aoa[r2]; if (!row) continue;
      var code = norm(row[0]);
      if (!code) continue;
      if (code.indexOf('GH90-') !== 0) { if (/^GH\d\d-/.test(code)) omitidos++; continue; }
      var q = cols.map(function (cc) { var n = Number(row[cc]); return (isFinite(n) && n > 0) ? n : 0; });
      var ex = null; for (var k = 0; k < filas.length; k++) if (filas[k].code === code) ex = filas[k];
      if (ex) { q.forEach(function (n, j) { ex.q[j] += n; }); } else filas.push({ code: code, desc: String(row[1] == null ? '' : row[1]).trim(), q: q });
    }
    return { semanas: semanas, filas: filas, omitidos: omitidos };
  }

  // ============================ CÁLCULO (lógica pura) ============================
  function margen(f) { f = Math.round(f); if (f <= 0) return 0; return f <= 100000 ? Math.ceil(f * 11 / 10) : Math.ceil(f * 101 / 100); }

  function consumir(items, cantidad, campo) {
    var rem = cantidad, usado = 0, nW = items.length ? items[0].net.length : 0;
    for (var w = 0; w < nW && rem > 0; w++) {
      for (var i = 0; i < items.length && rem > 0; i++) {
        var tk = Math.min(rem, items[i].net[w]);
        if (tk > 0) { items[i].net[w] -= tk; items[i][campo][w] += tk; items[i][campo + 'T'] += tk; rem -= tk; usado += tk; }
      }
    }
    return usado;
  }

  function filaPulp(bom, sm) {
    return bom.find(function (r) { var d = norm(r.desc); return r.sm === sm && d.indexOf('PULP') >= 0 && d.indexOf('TRAY') >= 0; });
  }
  // Bottom terminado del modelo: solo si hay UN renglón claro (no Sheet, no Chip Board, no Pulp). Si hay duda → null (no descuenta).
  function filaBottom(bom, sm) {
    var c = bom.filter(function (r) {
      var d = norm(r.desc);
      return r.sm === sm && d.indexOf('LOWER BOX') >= 0 && d.indexOf('BOTTOM') >= 0 && d.indexOf('SHEET') < 0 && d.indexOf('CHIP') < 0 && d.indexOf('PULP') < 0;
    });
    return c.length === 1 ? c[0] : null;
  }

  function calcular(fc, bom, produc, mapeo, opts) {
    opts = opts || {}; mapeo = mapeo || {}; produc = produc || {};
    var nW = fc.semanas.length;
    var items = [], sinModelo = [], sinPulp = [], sinDemanda = 0;
    fc.filas.forEach(function (f) {
      var tot = f.q.reduce(function (a, b) { return a + b; }, 0);
      if (tot <= 0) { sinDemanda++; return; }
      var cand = [];
      bom.forEach(function (r) { if (r.familia === 'GH90' && norm(r.pn) === f.code && r.sm && cand.indexOf(r.sm) < 0) cand.push(r.sm); });
      var sm = mapeo[f.code] || (cand.length === 1 ? cand[0] : null);
      if (!sm) { sinModelo.push({ code: f.code, desc: f.desc, tot: tot, cand: cand }); return; }
      var p = filaPulp(bom, sm);
      if (!p) { sinPulp.push({ code: f.code, desc: f.desc, sm: sm, tot: tot }); return; }
      var z = function () { var a = []; for (var i = 0; i < nW; i++) a.push(0); return a; };
      items.push({ code: f.code, desc: f.desc, sm: sm, pn: String(p.pn).trim(), pdesc: p.desc || '', pinv: Number(p.inv) || 0,
        fcw: f.q.slice(), net: f.q.slice(), prod: z(), prodT: 0, bot: z(), botT: 0, tot: tot });
    });

    // Producido (y Bottom hecho) se descuenta UNA vez por modelo, desde las primeras semanas
    var porSm = {}; items.forEach(function (it) { (porSm[it.sm] = porSm[it.sm] || []).push(it); });
    var sobra = {};
    Object.keys(porSm).forEach(function (sm) {
      var g = porSm[sm];
      var pr = produc[sm] ? Number(produc[sm].total) || 0 : 0;
      var usado = consumir(g, pr, 'prod');
      if (pr > usado) sobra[sm] = pr - usado;
      if (opts.descBottom) {
        var b = filaBottom(bom, sm);
        g.forEach(function (it) { it.botInv = b ? Number(b.inv) || 0 : 0; });
        if (b) consumir(g, Number(b.inv) || 0, 'bot');
      }
    });

    // Agrupar por Pulp Tray (el inventario se resta UNA vez por número de parte)
    var grupos = {}, orden = [];
    items.forEach(function (it) {
      var k = norm(it.pn) + '||' + norm(it.pdesc);
      if (!grupos[k]) {
        var z = function () { var a = []; for (var i = 0; i < nW; i++) a.push(0); return a; };
        grupos[k] = { pn: it.pn, desc: it.pdesc, inv: it.pinv, modelos: [], items: [], fc: z(), prod: z(), bot: z(), net: z() };
        orden.push(k);
      }
      var g = grupos[k]; g.items.push(it);
      if (g.modelos.indexOf(it.sm) < 0) g.modelos.push(it.sm);
      for (var w = 0; w < nW; w++) { g.fc[w] += it.fcw[w]; g.prod[w] += it.prod[w]; g.bot[w] += it.bot[w]; g.net[w] += it.net[w]; }
    });
    var lista = orden.map(function (k) {
      var g = grupos[k], cum = 0, prevF = 0;
      g.saldo = []; g.pedir = [];
      for (var w = 0; w < nW; w++) {
        cum += g.net[w];
        var falta = Math.max(0, cum - g.inv);
        g.saldo.push(g.inv - cum); g.pedir.push(falta - prevF); prevF = falta;
      }
      g.totFc = g.fc.reduce(function (a, b) { return a + b; }, 0);
      g.totProd = g.prod.reduce(function (a, b) { return a + b; }, 0);
      g.totBot = g.bot.reduce(function (a, b) { return a + b; }, 0);
      g.totNet = g.net.reduce(function (a, b) { return a + b; }, 0);
      g.falta = Math.max(0, g.totNet - g.inv);
      g.pedirSug = margen(g.falta);
      return g;
    });
    return { semanas: fc.semanas, grupos: lista, items: items, sinModelo: sinModelo, sinPulp: sinPulp, sinDemanda: sinDemanda, sobra: sobra };
  }

  // ============================ PANTALLA ============================
  // ---- Pestaña "🧻 Pulp Tray" (entre Empaque y Admin BOM) ----
  function ponerPestana() {
    if ($('tab-pulp')) return;
    var admin = $('tab-admin');
    if (!admin || !admin.parentNode) return;
    var tab = document.createElement('div');
    tab.className = 'tab'; tab.id = 'tab-pulp'; tab.textContent = t('btn');
    tab.onclick = function () { goTab('pulp'); };
    admin.parentNode.insertBefore(tab, admin);
    var pag = document.createElement('div');
    pag.className = 'page'; pag.id = 'page-pulp';
    pag.innerHTML = '<div id="ptCaja" style="max-width:1400px;margin:0 auto;color:var(--text,#fff);font-size:13px"></div>';
    var ref = $('page-admin');
    if (ref && ref.parentNode) ref.parentNode.insertBefore(pag, ref); else document.body.appendChild(pag);
    // Usuarios de solo lectura no ven esta pestaña (igual que Consolidado, Producir y Admin)
    if (typeof modoSoloSimulador !== 'undefined' && modoSoloSimulador) tab.style.display = 'none';
    if (typeof activarModoSoloSimulador === 'function' && !window.__ptWrapLectura) {
      window.__ptWrapLectura = true;
      var orig = activarModoSoloSimulador;
      window.activarModoSoloSimulador = function () { var r = orig.apply(this, arguments); var tb = $('tab-pulp'); if (tb) tb.style.display = 'none'; return r; };
    }
    // goTab ya muestra/oculta páginas por id; solo avisamos al abrir la nuestra
    if (typeof goTab === 'function' && !window.__ptWrapGoTab) {
      window.__ptWrapGoTab = true;
      var og = goTab;
      window.goTab = function (n) { var r = og.apply(this, arguments); if (n === 'pulp') mostrar(); return r; };
    }
  }
  function mostrar() {
    var c = $('ptCaja'); if (!c) return;
    if (typeof BOM === 'undefined' || !BOM.length) { c.innerHTML = '<div style="padding:1.5rem;color:#FFBA00;font-weight:600">' + esc(t('sinBom')) + '</div>'; return; }
    marco();
  }
  function banderas() {
    var l = lang();
    var f = function (x, c) { return '<button onclick="ptIdioma(\'' + x + '\')" style="border:' + (x === l ? '2px solid #4da6ff' : '1px solid transparent') + ';background:none;border-radius:4px;padding:1px;cursor:pointer"><img src="https://flagcdn.com/w40/' + c + '.png" alt="' + c.toUpperCase() + '" style="width:22px;display:block"></button>'; };
    return '<span style="display:flex;gap:3px">' + f('es', 'mx') + f('en', 'us') + f('ko', 'kr') + '</span>';
  }
  function edadIMS() {
    var ts = window._ultimoSyncIMS;
    if (!ts) return '<span style="color:#FFBA00">' + esc(t('nunca')) + '</span>';
    var min = Math.max(0, Math.round((Date.now() - ts) / 60000));
    return '<span style="color:' + (min > 120 ? '#FFBA00' : '#00e676') + '">' + esc(t('hace')(min)) + '</span>';
  }
  function marco() {
    $('ptCaja').innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:.7rem">' +
      '<div style="font-size:16px;font-weight:700">' + esc(t('titulo')) + '</div>' +
      '<div style="display:flex;gap:8px;align-items:center">' + banderas() + '</div></div>' +
      '<div style="padding:.5rem .7rem;border-radius:8px;background:rgba(77,166,255,.1);border:1px solid rgba(77,166,255,.35);color:#4da6ff;margin-bottom:.8rem">' + esc(t('pasos')) + '</div>' +
      '<div style="display:flex;gap:.6rem;flex-wrap:wrap;align-items:center;margin-bottom:.5rem">' +
      '<button class="btn btn-primary" onclick="document.getElementById(\'ptFile\').click()" style="font-size:14px;padding:9px 16px">' + esc(t('cargar')) + '</button>' +
      '<input id="ptFile" type="file" accept=".xlsx,.xlsm,.xls" style="display:none" onchange="ptArchivo(this)">' +
      '<button class="btn btn-secondary btn-sm" onclick="ptRecalcular()">' + esc(t('recalc')) + '</button>' +
      '<button class="btn btn-success btn-sm" onclick="ptExcel()">' + esc(t('excel')) + '</button>' +
      '<span id="ptNombre" style="color:var(--text2)">' + (S.nombre ? esc(t('archivo')) + ': <b style="color:var(--text)">' + esc(S.nombre) + '</b>' : '') + '</span></div>' +
      '<label style="display:flex;gap:6px;align-items:center;margin:.2rem 0" title="' + esc(t('descBottomAyuda')) + '"><input type="checkbox" id="ptDesc" onchange="ptToggleDesc(this.checked)"' + (S.desc ? ' checked' : '') + '> ' + esc(t('descBottom')) + '</label>' +
      '<div style="font-size:11px;color:var(--text2);margin:0 0 .5rem 22px">' + esc(t('descBottomAyuda')) + '</div>' +
      '<div style="font-size:12px;color:var(--text2);margin-bottom:.6rem">' + esc(t('ims')) + ': ' + edadIMS() + '</div>' +
      '<div id="ptMsg" style="display:none"></div><div id="ptRes"></div>';
    pintar();
  }
  function msg(txt, tipo) {
    var el = $('ptMsg'); if (!el) return;
    if (!txt) { el.style.display = 'none'; return; }
    var c = tipo === 'ok' ? ['#00e676', 'rgba(0,230,118,.12)'] : tipo === 'err' ? ['#ff4444', 'rgba(255,68,68,.12)'] : ['#FFBA00', 'rgba(255,186,0,.12)'];
    el.style.cssText = 'display:block;margin-bottom:.6rem;padding:.5rem .7rem;border-radius:8px;font-weight:600;white-space:pre-wrap;color:' + c[0] + ';background:' + c[1] + ';border:1px solid ' + c[0];
    el.textContent = txt;
  }
  function idioma(l) {
    try { localStorage.setItem('autoChkLang', l); } catch (e) {}
    var b = $('tab-pulp'); if (b) b.textContent = t('btn');
    if (typeof pintarAutochequeo === 'function') { try { pintarAutochequeo(); } catch (e) {} }
    marco();
  }

  var TH = 'padding:5px 8px;border-bottom:1px solid var(--border,#334);text-align:right;white-space:nowrap;color:var(--text2)';
  var TD = 'padding:5px 8px;border-bottom:1px solid rgba(255,255,255,.05);text-align:right;white-space:nowrap';
  function card(titulo, valor, sub, color) {
    return '<div style="flex:1;min-width:190px;padding:.7rem .9rem;border-radius:10px;background:var(--bg3,#151c2e);border:1px solid var(--border,#334)">' +
      '<div style="font-size:11px;color:var(--text2)">' + esc(titulo) + '</div><div style="font-size:24px;font-weight:700;color:' + color + '">' + fmt(valor) + '</div>' +
      '<div style="font-size:10px;color:var(--text2)">' + esc(sub) + '</div></div>';
  }

  function pintar() {
    var cont = $('ptRes'); if (!cont) return;
    if (!S.res) { cont.innerHTML = '<div style="padding:1.5rem;text-align:center;color:var(--text2)">' + esc(t('vacio')) + '</div>'; return; }
    var R = S.res, h = '';
    var tReq = 0, tInv = 0, tFalta = 0, tPed = 0;
    R.grupos.forEach(function (g) { tReq += g.totNet; tInv += g.inv; tFalta += g.falta; tPed += g.pedirSug; });
    h += '<div style="display:flex;gap:.7rem;flex-wrap:wrap;margin-bottom:.8rem">' +
      card(t('cReq'), tReq, t('cReqS'), '#4da6ff') + card(t('cInv'), tInv, '', '#00e676') +
      card(t('cFalta'), tFalta, t('cFaltaS'), tFalta > 0 ? '#ff4444' : '#00e676') + card(t('cPedir'), tPed, t('cPedirS'), '#FFBA00') + '</div>';
    h += '<div style="font-size:11px;color:var(--text2);margin-bottom:.6rem">' + esc(t('resumen')(R.items.length + R.sinPulp.length + R.sinModelo.length, R.items.length, R.sinPulp.length, R.sinModelo.length)) +
      (S.fc.omitidos ? ' · ' + esc(t('ignorados')(S.fc.omitidos)) : '') + '</div>';
    var sob = Object.keys(R.sobra); if (sob.length) h += '<div style="font-size:11px;color:var(--text2);margin-bottom:.6rem">' + esc(t('sobra')(sob.map(function (k) { return k + ' ' + fmt(R.sobra[k]); }).join(', '))) + '</div>';

    // semanas con demanda
    var act = []; R.semanas.forEach(function (s, w) { if (R.grupos.some(function (g) { return g.fc[w] > 0; })) act.push(w); });

    R.grupos.forEach(function (g) {
      h += '<div style="margin:.9rem 0 .3rem;display:flex;gap:.8rem;flex-wrap:wrap;align-items:baseline">' +
        '<b style="font-size:14px">' + esc(g.pn) + '</b><span style="color:var(--text2)">' + esc(g.desc) + '</span>' +
        '<span style="color:var(--text2)">' + esc(t('inv')) + ': <b style="color:var(--text)">' + fmt(g.inv) + '</b></span>' +
        '<span style="font-weight:700;color:' + (g.falta > 0 ? '#ff4444' : '#00e676') + '">' + (g.falta > 0 ? esc(t('falta')) + ' ' + fmt(g.falta) : esc(t('ok'))) + '</span></div>' +
        '<div style="font-size:11px;color:var(--text2);margin-bottom:.3rem">' + esc(t('usadoEn')) + ': ' + esc(g.modelos.join(', ')) + '</div>' +
        '<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:12px;width:100%"><thead><tr><th style="' + TH + ';text-align:left"></th>' +
        act.map(function (w) { return '<th style="' + TH + '">' + esc(t('semana')) + R.semanas[w] + '</th>'; }).join('') + '<th style="' + TH + '">' + esc(t('total')) + '</th></tr></thead><tbody>';
      var fila = function (nom, arr, tot, estilo, colorFn) {
        return '<tr><td style="' + TD + ';text-align:left;' + estilo + '">' + esc(nom) + '</td>' +
          act.map(function (w) { return '<td style="' + TD + ';' + estilo + (colorFn ? ';color:' + colorFn(arr[w]) : '') + '">' + (arr[w] ? fmt(arr[w]) : '–') + '</td>'; }).join('') +
          '<td style="' + TD + ';font-weight:700;' + estilo + '">' + (tot == null ? '' : fmt(tot)) + '</td></tr>';
      };
      h += fila(t('rFc'), g.fc, g.totFc, 'color:var(--text2)');
      h += fila(t('rProd'), g.prod, g.totProd, 'color:var(--text2)');
      if (S.desc) h += fila(t('rBot'), g.bot, g.totBot, 'color:var(--text2)');
      h += fila(t('rNet'), g.net, g.totNet, 'font-weight:700;background:rgba(77,166,255,.08)');
      h += fila(t('rSaldo'), g.saldo, null, '', function (v) { return v < 0 ? '#ff4444' : '#00e676'; });
      h += fila(t('rPedir'), g.pedir, g.falta, 'font-weight:700', function (v) { return v > 0 ? '#FFBA00' : 'inherit'; });
      h += '</tbody></table></div>';
    });
    if (!R.grupos.length) h += '<div style="padding:1rem;color:#FFBA00">' + esc(t('sinPulp')) + '</div>';

    // no encontrados en el BOM
    if (R.sinModelo.length) {
      var modelos = []; BOM.forEach(function (r) { if (r.sm && modelos.indexOf(r.sm) < 0) modelos.push(r.sm); }); modelos.sort();
      h += '<div style="margin-top:1rem;padding:.6rem .8rem;border-radius:8px;background:rgba(255,186,0,.1);border:1px solid #FFBA00"><b style="color:#FFBA00">' + esc(t('sinBomT')) + '</b>' +
        '<div style="font-size:11px;color:var(--text2);margin:.2rem 0 .5rem">' + esc(t('sinBomA')) + '</div>' +
        R.sinModelo.map(function (x) {
          var cands = x.cand.length ? x.cand : [];
          var opts = '<option value="">' + esc(t('elige')) + '</option>' + cands.concat(modelos.filter(function (m) { return cands.indexOf(m) < 0; })).map(function (m) { return '<option value="' + esc(m) + '">' + esc(m) + '</option>'; }).join('');
          return '<div style="display:flex;gap:.6rem;align-items:center;margin:3px 0;flex-wrap:wrap"><b>' + esc(x.code) + '</b><span style="color:var(--text2);flex:1;min-width:180px">' + esc(x.desc) + '</span><span>' + fmt(x.tot) + '</span>' +
            '<select onchange="ptAsignar(\'' + esc(x.code) + '\',this.value)" style="background:var(--bg3,#151c2e);border:1px solid var(--border,#334);color:var(--text,#fff);border-radius:6px;padding:4px 6px">' + opts + '</select></div>';
        }).join('') + '</div>';
    }
    if (R.sinPulp.length) {
      h += '<div style="margin-top:.8rem;padding:.5rem .8rem;border-radius:8px;border:1px solid var(--border,#334);color:var(--text2);font-size:12px"><b>' + esc(t('sinPulpT')) + '</b><br>' +
        R.sinPulp.map(function (x) { return esc(x.code) + ' · ' + esc(x.sm) + ' · ' + fmt(x.tot); }).join('<br>') + '</div>';
    }
    // detalle por modelo
    var c = T[lang()].cDet;
    h += '<details style="margin-top:.8rem"><summary style="cursor:pointer;color:#4da6ff">' + esc(t('detalleT')) + '</summary><div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:12px;width:100%;margin-top:.4rem"><thead><tr>' +
      c.map(function (x, i) { return '<th style="' + TH + (i < 4 ? ';text-align:left' : '') + '">' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      R.items.map(function (it) {
        var net = it.net.reduce(function (a, b) { return a + b; }, 0);
        return '<tr><td style="' + TD + ';text-align:left">' + esc(it.code) + '</td><td style="' + TD + ';text-align:left;color:var(--text2)">' + esc(it.desc) + '</td><td style="' + TD + ';text-align:left">' + esc(it.sm) + '</td><td style="' + TD + ';text-align:left">' + esc(it.pn) + '</td>' +
          '<td style="' + TD + '">' + fmt(it.tot) + '</td><td style="' + TD + '">' + fmt(it.prodT) + '</td><td style="' + TD + '">' + fmt(it.botT) + '</td><td style="' + TD + ';font-weight:700">' + fmt(net) + '</td></tr>';
      }).join('') + '</tbody></table></div></details>';
    cont.innerHTML = h;
  }

  // ============================ ACCIONES ============================
  async function traerProducido(forzar) {
    S.prodOk = true;
    try {
      if (typeof obtenerProduccionRealASSY1 !== 'function' || typeof db === 'undefined' || !db) { S.prodOk = false; S.prod = {}; return; }
      var d = await obtenerProduccionRealASSY1(!forzar); // auto=true reutiliza el caché de 20 min (ahorra lecturas)
      if (!d) { S.prodOk = false; S.prod = {}; } else S.prod = d;
    } catch (e) { S.prodOk = false; S.prod = {}; }
  }
  function recalcLocal() {
    S.res = calcular(S.fc, BOM, S.prod, leerMapeo(), { descBottom: S.desc });
    msg(S.prodOk ? '' : t('prodErr'), 'warn');
    pintar();
  }
  async function correr(forzar) {
    if (S.ocupado) return; S.ocupado = true;
    try {
      if (typeof BOM === 'undefined' || !BOM.length) { msg(t('sinBom'), 'err'); return; }
      if (!S.fc) { msg(t('vacio'), 'warn'); return; }
      msg(t('leyendo'), 'warn');
      await traerProducido(forzar);
      recalcLocal();
      var b = $('ptNombre'); if (b) b.innerHTML = esc(t('archivo')) + ': <b style="color:var(--text)">' + esc(S.nombre) + '</b>';
    } catch (e) { msg(t('error') + (e && e.message ? e.message : e), 'err'); }
    finally { S.ocupado = false; }
  }
  function archivo(inp) {
    var f = inp.files && inp.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function (ev) {
      try {
        var wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
        var fc = leerForecast(wb);
        if (!fc) { msg(t('formato'), 'err'); return; }
        if (!fc.filas.length) { msg(t('sinDatos'), 'err'); return; }
        S.fc = fc; S.nombre = f.name; inp.value = '';
        correr(false);
      } catch (e) { msg(t('error') + (e && e.message ? e.message : e), 'err'); }
    };
    rd.readAsArrayBuffer(f);
  }
  function asignar(code, sm) {
    if (!sm) return;
    var m = leerMapeo(); m[code] = sm; guardarMapeo(m);
    if (S.fc) recalcLocal();
  }
  function toggleDesc(v) { S.desc = !!v; if (S.fc) recalcLocal(); }

  function excel() {
    if (!S.res) { msg(t('vacio'), 'warn'); return; }
    var R = S.res, wb = XLSX.utils.book_new();
    var head = function (ws, n) { for (var c = 0; c < n; c++) { var a = XLSX.utils.encode_cell({ r: 0, c: c }); if (ws[a]) ws[a].s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1F3A5F' } }, alignment: { horizontal: 'center', wrapText: true } }; } };
    var numFmt = function (ws) { Object.keys(ws).forEach(function (k) { if (k[0] !== '!' && ws[k].t === 'n') ws[k].z = '#,##0'; }); };
    var cw = function (ws, w) { ws['!cols'] = w.map(function (x) { return { wch: x }; }); };
    // Resumen
    var a1 = [['Pulp Tray PN', 'Descripción', 'Modelos', 'Forecast', 'Producido', 'Bottom hecho', 'Requerido', 'Inventario IMS P4', 'Falta', 'Pedir sugerido (con margen)']];
    R.grupos.forEach(function (g) { a1.push([g.pn, g.desc, g.modelos.join(', '), g.totFc, g.totProd, g.totBot, g.totNet, g.inv, g.falta, g.pedirSug]); });
    var w1 = XLSX.utils.aoa_to_sheet(a1); head(w1, 10); numFmt(w1); cw(w1, [18, 28, 40, 12, 12, 12, 12, 16, 12, 18]); XLSX.utils.book_append_sheet(wb, w1, 'Resumen');
    // Semanal
    var a2 = [['Pulp Tray PN', 'Concepto'].concat(R.semanas.map(function (s) { return 'W' + s; }), ['Total'])];
    R.grupos.forEach(function (g) {
      [['Forecast', g.fc, g.totFc], ['(-) Producido', g.prod, g.totProd], ['(-) Bottom hecho', g.bot, g.totBot], ['Requerido', g.net, g.totNet], ['Saldo con inventario', g.saldo, null], ['Pedir esa semana', g.pedir, g.falta]]
        .forEach(function (r) { if (r[0] === '(-) Bottom hecho' && !S.desc) return; a2.push([g.pn, r[0]].concat(r[1], [r[2] == null ? '' : r[2]])); });
    });
    var w2 = XLSX.utils.aoa_to_sheet(a2); head(w2, 3 + R.semanas.length - 1 + 1); numFmt(w2); cw(w2, [18, 22].concat(R.semanas.map(function () { return 10; }), [12])); XLSX.utils.book_append_sheet(wb, w2, 'Semanal');
    // Por modelo
    var a3 = [['Código Forecast', 'Descripción', 'Modelo BOM', 'Pulp Tray PN', 'Forecast', 'Producido', 'Bottom hecho', 'Requerido']];
    R.items.forEach(function (it) { a3.push([it.code, it.desc, it.sm, it.pn, it.tot, it.prodT, it.botT, it.net.reduce(function (a, b) { return a + b; }, 0)]); });
    var w3 = XLSX.utils.aoa_to_sheet(a3); head(w3, 8); numFmt(w3); cw(w3, [16, 44, 22, 18, 12, 12, 12, 12]); XLSX.utils.book_append_sheet(wb, w3, 'Por modelo');
    // Pendientes
    if (R.sinModelo.length || R.sinPulp.length) {
      var a4 = [['Estado', 'Código Forecast', 'Descripción', 'Modelo BOM', 'Forecast']];
      R.sinModelo.forEach(function (x) { a4.push(['No está en el BOM', x.code, x.desc, '', x.tot]); });
      R.sinPulp.forEach(function (x) { a4.push(['Sin Pulp Tray en BOM', x.code, x.desc, x.sm, x.tot]); });
      var w4 = XLSX.utils.aoa_to_sheet(a4); head(w4, 5); numFmt(w4); cw(w4, [22, 16, 44, 22, 12]); XLSX.utils.book_append_sheet(wb, w4, 'Pendientes');
    }
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    XLSX.writeFile(wb, 'Pulp_Tray_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '.xlsx');
  }

  window.ptIdioma = idioma; window.ptArchivo = archivo; window.ptRecalcular = function () { correr(true); };
  window.ptAsignar = asignar; window.ptToggleDesc = toggleDesc; window.ptExcel = excel;
  window.__ptCore = { leerForecast: leerForecast, calcular: calcular, margen: margen }; // para pruebas
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ponerPestana); else ponerPestana();
})();
