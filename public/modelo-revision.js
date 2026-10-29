/* ============================================================================
   MODELO EN REVISIÓN — BOM Simulator P4
   Revisa UN solo modelo (qué pedir / qué producir) SIN tocar el plan guardado.
   Usa el mismo motor del simulador (calcSim, renderCons, renderProd).
   Todo es temporal: al terminar se restaura exactamente el estado anterior.
   No lee ni escribe Firebase. No guarda nada en localStorage.
   ES / EN / KO (comparte el idioma del Autochequeo y Conteo físico).
   ============================================================================ */
(function () {
  'use strict';
  if (window.__modeloRevisionCargado) return;
  window.__modeloRevisionCargado = true;

  var T = {
    es: { btn: '🔍 Código padre en revisión', titulo: '🔍 Código padre en revisión',
      aviso: 'Solo cálculo temporal de UN código padre: no cambia tu plan, targets, prioridades ni lo publicado al piso. No guarda nada.',
      gh: 'Código padre (GH90)', todos: '— Todos —', modelo: 'Modelo SM', cant: 'Cantidad a producir', yaProd: 'Ya producido (opcional)', calcular: 'Calcular', cerrar: '✕ Cerrar',
      ims: 'Inventario IMS', nunca: 'sin sincronizar — presiona Sync IMS arriba', hace: function (m) { return 'actualizado hace ' + m + ' min'; },
      sec1: '1) Requerido vs inventario', sec2: '2) Qué pedir (Consolidado: +10% / +1% si pasa de 100,000)', sec3: '3) Producir / Ranurar',
      excel: '⬇ Excel', sinBom: 'Primero carga un BOM.', elige: 'Elige un modelo SM y una cantidad mayor a 0.', calculando: '⏳ Calculando...',
      error: 'No se pudo calcular: ', listo: '✓ Listo — esto es solo una revisión, tu plan no cambió.', seleccionar: '— Seleccionar modelo —',
      c: ['N° Parte', 'Descripción', 'Familia', 'Destino', 'Inventario', 'Requerido', 'Diferencia', 'Precio USD', 'Estado'] },
    en: { btn: '🔍 Parent code under review', titulo: '🔍 Parent code under review',
      aviso: 'Temporary calculation of ONE parent code only: it does not change your plan, targets, priorities or what is published to the floor. Nothing is saved.',
      gh: 'Parent code (GH90)', todos: '— All —', modelo: 'SM model', cant: 'Quantity to produce', yaProd: 'Already produced (optional)', calcular: 'Calculate', cerrar: '✕ Close',
      ims: 'IMS inventory', nunca: 'not synced — press Sync IMS above', hace: function (m) { return 'updated ' + m + ' min ago'; },
      sec1: '1) Required vs inventory', sec2: '2) What to order (Consolidated: +10% / +1% above 100,000)', sec3: '3) Produce / Groove',
      excel: '⬇ Excel', sinBom: 'Load a BOM first.', elige: 'Pick an SM model and a quantity greater than 0.', calculando: '⏳ Calculating...',
      error: 'Could not calculate: ', listo: '✓ Done — this is only a review, your plan did not change.', seleccionar: '— Select model —',
      c: ['Part No.', 'Description', 'Family', 'Dest.', 'Inventory', 'Required', 'Difference', 'Price USD', 'Status'] },
    ko: { btn: '🔍 상위 코드 검토', titulo: '🔍 상위 코드 검토',
      aviso: '상위 코드 1개만 임시 계산합니다. 저장된 계획, 목표, 우선순위, 현장 게시 내용은 바뀌지 않으며 아무것도 저장되지 않습니다.',
      gh: '상위 코드 (GH90)', todos: '— 전체 —', modelo: 'SM 모델', cant: '생산 수량', yaProd: '이미 생산된 수량 (선택)', calcular: '계산', cerrar: '✕ 닫기',
      ims: 'IMS 재고', nunca: '동기화 안 됨 — 위의 Sync IMS를 누르세요', hace: function (m) { return m + '분 전 업데이트'; },
      sec1: '1) 필요 수량 vs 재고', sec2: '2) 발주 내용 (통합: +10% / 100,000 초과 시 +1%)', sec3: '3) 생산 / 홈가공',
      excel: '⬇ Excel', sinBom: '먼저 BOM을 불러오세요.', elige: 'SM 모델과 0보다 큰 수량을 선택하세요.', calculando: '⏳ 계산 중...',
      error: '계산할 수 없습니다: ', listo: '✓ 완료 — 검토용일 뿐이며 계획은 바뀌지 않았습니다.', seleccionar: '— 모델 선택 —',
      c: ['부품 번호', '설명', '계열', '목적지', '재고', '필요', '차이', '가격 USD', '상태'] }
  };

  function lang() { try { var l = localStorage.getItem('autoChkLang'); if (T[l]) return l; } catch (e) {} return 'es'; }
  function t(k) { return T[lang()][k]; }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var S = { gh: '', sm: '', qty: '', prod: '', res: null, ocupado: false };

  // ---------- Botón en la barra superior ----------
  function ponerBoton() {
    if ($('btnModeloRevision')) return;
    var cont = document.querySelector('.topbar > div:last-child');
    if (!cont) return;
    var b = document.createElement('button');
    b.id = 'btnModeloRevision';
    b.className = 'btn btn-secondary btn-sm';
    b.textContent = t('btn');
    b.onclick = abrir;
    var ref = cont.querySelector('button[onclick="cfAbrir()"]');
    if (ref) cont.insertBefore(b, ref); else cont.appendChild(b);
  }

  // ---------- Ventana ----------
  function caja() {
    var m = $('mrModal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'mrModal';
      m.style.cssText = 'position:fixed;inset:0;z-index:9990;background:rgba(0,0,0,.6);display:none;overflow:auto;padding:24px 12px';
      m.innerHTML = '<div id="mrCaja" style="max-width:1150px;margin:0 auto;background:var(--bg2,#0d1220);border:1px solid var(--border,#334);border-radius:12px;padding:1rem 1.2rem;color:var(--text,#fff);font-size:13px"></div>';
      document.body.appendChild(m);
    }
    return m;
  }
  function banderas() {
    var l = lang();
    var f = function (x, c) { return '<button onclick="mrIdioma(\'' + x + '\')" style="border:' + (x === l ? '2px solid #4da6ff' : '1px solid transparent') + ';background:none;border-radius:4px;padding:1px;cursor:pointer"><img src="https://flagcdn.com/w40/' + c + '.png" alt="' + c.toUpperCase() + '" style="width:22px;display:block"></button>'; };
    return '<span style="display:flex;gap:3px">' + f('es', 'mx') + f('en', 'us') + f('ko', 'kr') + '</span>';
  }
  function edadIMS() {
    var ts = window._ultimoSyncIMS;
    if (!ts) return '<span style="color:#FFBA00">' + esc(t('nunca')) + '</span>';
    var min = Math.max(0, Math.round((Date.now() - ts) / 60000));
    return '<span style="color:' + (min > 120 ? '#FFBA00' : '#00e676') + '">' + esc(t('hace')(min)) + '</span>';
  }
  function ghBOM() {
    var set = {}; BOM.forEach(function (r) { if (r.familia === 'GH90' && r.pn) set[String(r.pn).trim()] = 1; });
    return Object.keys(set).sort();
  }
  function modelosBOM() {
    var set = {};
    BOM.forEach(function (r) { if (r.sm && (!S.gh || (r.familia === 'GH90' && String(r.pn).trim() === S.gh))) set[r.sm] = 1; });
    return Object.keys(set).sort();
  }
  function marco() {
    var sel = 'background:var(--bg3,#151c2e);border:1px solid var(--border,#334);color:var(--text,#fff);border-radius:6px;padding:7px 9px;font-size:13px';
    var ghOpts = '<option value="">' + esc(t('todos')) + '</option>' + ghBOM().map(function (g) {
      return '<option value="' + esc(g) + '"' + (g === S.gh ? ' selected' : '') + '>' + esc(g) + '</option>';
    }).join('');
    var opts = '<option value="">' + esc(t('seleccionar')) + '</option>' + modelosBOM().map(function (m) {
      return '<option value="' + esc(m) + '"' + (m === S.sm ? ' selected' : '') + '>' + esc(m) + '</option>';
    }).join('');
    $('mrCaja').innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:.7rem">' +
      '<div style="font-size:16px;font-weight:700">' + esc(t('titulo')) + '</div>' +
      '<div style="display:flex;gap:8px;align-items:center">' + banderas() + '<button class="btn btn-secondary btn-sm" onclick="mrCerrar()">' + esc(t('cerrar')) + '</button></div></div>' +
      '<div style="padding:.5rem .7rem;border-radius:8px;background:rgba(77,166,255,.1);border:1px solid rgba(77,166,255,.35);color:#4da6ff;margin-bottom:.8rem">' + esc(t('aviso')) + '</div>' +
      '<div style="display:flex;gap:.8rem;flex-wrap:wrap;align-items:flex-end;margin-bottom:.4rem">' +
      '<label>' + esc(t('gh')) + '<br><select id="mrGh" onchange="mrFiltrar()" style="' + sel + ';min-width:200px">' + ghOpts + '</select></label>' +
      '<label>' + esc(t('modelo')) + '<br><select id="mrSm" style="' + sel + ';min-width:220px">' + opts + '</select></label>' +
      '<label>' + esc(t('cant')) + '<br><input id="mrQty" type="number" min="1" value="' + esc(S.qty) + '" style="' + sel + ';width:140px" onkeydown="if(event.key===\'Enter\')mrCalcular()"></label>' +
      '<label>' + esc(t('yaProd')) + '<br><input id="mrProd" type="number" min="0" value="' + esc(S.prod) + '" style="' + sel + ';width:150px" onkeydown="if(event.key===\'Enter\')mrCalcular()"></label>' +
      '<button class="btn btn-primary btn-sm" id="mrBtn" onclick="mrCalcular()">' + esc(t('calcular')) + '</button></div>' +
      '<div style="font-size:12px;color:var(--text2);margin-bottom:.6rem">' + esc(t('ims')) + ': ' + edadIMS() + '</div>' +
      '<div id="mrMsg" style="display:none"></div><div id="mrRes"></div>';
    pintarRes();
  }
  function msg(txt, tipo) {
    var el = $('mrMsg'); if (!el) return;
    if (!txt) { el.style.display = 'none'; return; }
    var c = tipo === 'ok' ? ['#00e676', 'rgba(0,230,118,.12)'] : tipo === 'err' ? ['#ff4444', 'rgba(255,68,68,.12)'] : ['#FFBA00', 'rgba(255,186,0,.12)'];
    el.style.cssText = 'display:block;margin-bottom:.6rem;padding:.5rem .7rem;border-radius:8px;font-weight:600;white-space:pre-wrap;color:' + c[0] + ';background:' + c[1] + ';border:1px solid ' + c[0];
    el.textContent = txt;
  }
  function guardarCampos() {
    if ($('mrSm')) { if ($('mrGh')) S.gh = $('mrGh').value; S.sm = $('mrSm').value; S.qty = $('mrQty').value; S.prod = $('mrProd').value; }
  }
  function abrir() {
    if (typeof BOM === 'undefined' || !BOM.length) { alert(t('sinBom')); return; }
    if (!S.sm) { var s = $('simModelo'); if (s && s.value) S.sm = s.value; }
    caja().style.display = 'block';
    marco();
  }
  function filtrar() {
    guardarCampos();
    var m = modelosBOM();
    if (m.indexOf(S.sm) < 0) S.sm = (S.gh && m.length === 1) ? m[0] : '';
    marco();
  }
  function cerrar() { var m = $('mrModal'); if (m) m.style.display = 'none'; }
  function idioma(l) {
    try { localStorage.setItem('autoChkLang', l); } catch (e) {}
    guardarCampos();
    var b = $('btnModeloRevision'); if (b) b.textContent = t('btn');
    if (typeof pintarAutochequeo === 'function') { try { pintarAutochequeo(); } catch (e) {} }
    marco();
  }

  // ---------- Resultados ----------
  function pintarRes() {
    var cont = $('mrRes'); if (!cont) return;
    var r = S.res;
    if (!r) { cont.innerHTML = ''; return; }
    var th = 'text-align:left;padding:8px 10px;font-size:9px;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;background:var(--bg3,#151c2e);border-bottom:1px solid var(--border,#334)';
    var head = t('c').map(function (x, i) { return '<th style="' + th + (i >= 4 && i <= 7 ? ';text-align:right' : (i === 2 || i === 3 || i === 8 ? ';text-align:center' : '')) + '">' + esc(x) + '</th>'; }).join('');
    var h = '<div style="margin:.2rem 0 .8rem;padding:.4rem .7rem;border-radius:8px;color:#00e676;background:rgba(0,230,118,.1);border:1px solid rgba(0,230,118,.35);font-weight:600">' +
      esc(t('listo')) + ' <b style="color:var(--accent,#4da6ff)">' + esc(r.sm) + '</b> · ' + Number(r.qty).toLocaleString('en-US') + (r.prod > 0 ? ' (−' + Number(r.prod).toLocaleString('en-US') + ')' : '') + '</div>';
    h += '<div class="stats-grid">' + r.stats + '</div>';
    if (r.cuello) h += '<div class="card"><div class="card-title">⛔</div>' + r.cuello + '</div>';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin:.9rem 0 .4rem"><b>' + esc(t('sec1')) + '</b><button class="btn btn-success btn-sm" onclick="mrExcel()">' + esc(t('excel')) + '</button></div>' +
      '<div class="table-wrap"><table class="dt"><thead><tr>' + head + '</tr></thead><tbody id="mrSimBody">' + r.sim + '</tbody></table></div>';
    h += '<div style="margin:.9rem 0 .4rem"><b>' + esc(t('sec2')) + '</b></div><div id="mrCons">' + r.cons + '</div>';
    h += '<div style="margin:.9rem 0 .4rem"><b>' + esc(t('sec3')) + '</b></div><div id="mrProdSec">' + r.prod + '</div>';
    cont.innerHTML = h;
    // Solo revisión: se apagan los selectores de Destino para que NADA cambie el BOM real
    Array.prototype.forEach.call(cont.querySelectorAll('select'), function (s) { s.disabled = true; s.removeAttribute('onchange'); });
  }

  // ---------- Cálculo temporal con restauración total ----------
  var IDS_DOM = ['consTablas', 'consCapasBar', 'consCards', 'consTitle', 'consEmpty', 'consContent',
                 'prodTablas', 'prodTitle', 'prodEmpty', 'prodContent'];

  function calcular() {
    if (S.ocupado) return;
    guardarCampos();
    if (typeof BOM === 'undefined' || !BOM.length) { msg(t('sinBom'), 'err'); return; }
    var sm = S.sm, qty = parseInt(S.qty, 10) || 0, prod = Math.max(0, parseInt(S.prod, 10) || 0);
    if (!sm || !(qty > 0)) { msg(t('elige'), 'warn'); return; }
    if (!BOM.some(function (r) { return r.sm === sm; })) { msg(t('elige'), 'warn'); return; }
    msg(t('calculando'), 'warn');
    S.ocupado = true;
    var btn = $('mrBtn'); if (btn) btn.disabled = true;

    // 1) Guardar TODO lo que se va a tocar
    var g = {
      targets: simTargetsPorModelo,
      prod: window.simProducidoManualPorModelo,
      po: window.simPOBalancePorModelo,
      modo: window.consModo,
      data: window.consolidadoData,
      capas: window.consCapas,
      filtro: simFiltro,
      pendCons: !!(window._vistasPendientes && window._vistasPendientes.cons)
    };
    var reqs = BOM.filter(function (r) { return r.sm === sm; }).map(function (r) { return [r, r._reqReal, Object.prototype.hasOwnProperty.call(r, '_reqReal')]; });
    var dom = {};
    IDS_DOM.forEach(function (id) { var e = $(id); if (e) dom[id] = { e: e, h: e.innerHTML, d: e.style.display }; });
    var sel = $('simModelo'), tg = $('simTarget'), selO = sel ? sel.value : '', tgO = tg ? tg.value : '', tmpOpt = null;

    var res = { sm: sm, qty: qty, prod: prod }, error = null;
    window._cascadaPoolActiva = (window._cascadaPoolActiva || 0) + 1;   // evita refrescos en cadena mientras se calcula
    try {
      // 2) Estado temporal: SOLO este modelo, sin PO Balance, vista "urgente"
      simTargetsPorModelo = {}; simTargetsPorModelo[sm] = qty;
      window.simProducidoManualPorModelo = {}; if (prod > 0) window.simProducidoManualPorModelo[sm] = prod;
      window.simPOBalancePorModelo = {};
      window.consModo = function () { return 'urgente'; };
      simFiltro = 'todos';

      // 3a) Requerido vs inventario (mismo calcSim)
      if (!Array.prototype.some.call(sel.options, function (o) { return o.value === sm; })) { tmpOpt = new Option(sm, sm); sel.add(tmpOpt); }
      sel.value = sm; tg.value = String(qty);
      calcSim();
      res.sim = $('simTable').innerHTML;
      res.stats = $('simStats').innerHTML;
      res.cuello = ($('simCuello').style.display !== 'none') ? $('simCuelloContent').innerHTML : '';
      // 3b) Consolidado (mismo renderCons)
      renderCons();
      res.cons = $('consTablas').innerHTML;
      // 3c) Producir / Ranurar (mismo renderProd)
      renderProd();
      res.prod = $('prodTablas').innerHTML;
    } catch (e) {
      error = e; console.error('[Modelo en revisión]', e);
    } finally {
      // 4) Restaurar TODO, pase lo que pase
      try { if (tmpOpt && tmpOpt.parentNode) sel.remove(tmpOpt.index); } catch (e) {}
      try { if (sel) sel.value = selO; if (tg) tg.value = tgO; } catch (e) {}
      simTargetsPorModelo = g.targets;
      window.simProducidoManualPorModelo = g.prod;
      window.simPOBalancePorModelo = g.po;
      window.consModo = g.modo;
      window.consolidadoData = g.data;
      window.consCapas = g.capas;
      simFiltro = g.filtro;
      reqs.forEach(function (x) { if (x[2]) x[0]._reqReal = x[1]; else delete x[0]._reqReal; });
      Object.keys(dom).forEach(function (id) { dom[id].e.innerHTML = dom[id].h; dom[id].e.style.display = dom[id].d; });
      window._cascadaPoolActiva = Math.max(0, (window._cascadaPoolActiva || 1) - 1);
      try { calcSim(); } catch (e) { console.error('[Modelo en revisión] restaurar simulador', e); }
      if (g.pendCons) { window._vistasPendientes = window._vistasPendientes || {}; window._vistasPendientes.cons = true; }
      S.ocupado = false;
      var b2 = $('mrBtn'); if (b2) b2.disabled = false;
    }
    if (error) { msg(t('error') + (error.message || error), 'err'); return; }
    S.res = res;
    msg('');
    pintarRes();
  }

  // ---------- Excel de la tabla 1 ----------
  function excel() {
    var tb = $('mrSimBody');
    if (!tb || !S.res || typeof construirHojaModeloExcel !== 'function' || typeof XLSX === 'undefined') return;
    var ws = construirHojaModeloExcel(tb);
    if (!ws) return;
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, String(S.res.sm).replace(/[:\\/?*\[\]]/g, '-').substring(0, 31));
    var f = new Date().toISOString().slice(0, 10);
    var out = (typeof formatoMilesWb === 'function') ? formatoMilesWb(wb) : wb;
    XLSX.writeFile(out, 'BOM_Revision_' + String(S.res.sm).replace(/[^A-Za-z0-9_-]/g, '_') + '_' + f + '.xlsx');
  }

  window.mrCalcular = calcular; window.mrCerrar = cerrar; window.mrFiltrar = filtrar; window.mrIdioma = idioma; window.mrExcel = excel; window.mrAbrir = abrir;
  ponerBoton();
})();
