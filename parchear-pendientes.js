// Parche: evita que los pallets pendientes (sin escanear) se sumen dos veces al inventario del piso.
// Uso: node parchear-pendientes.js   (dentro de la carpeta 12. bom-simulator-deploy)
const fs = require('fs');
const ruta = 'public/index.html';
if (!fs.existsSync(ruta)) { console.log('NO ENCUENTRO ' + ruta + '. Corre este comando dentro de la carpeta 12. bom-simulator-deploy'); process.exit(1); }
let s = fs.readFileSync(ruta, 'utf8');
const crlf = s.indexOf('\r\n') >= 0;
if (crlf) s = s.replace(/\r\n/g, '\n');
if (s.indexOf('_sincIMSFrescoReal') >= 0) { console.log('Este parche YA estaba aplicado. No se cambió nada.'); process.exit(0); }

function cambiar(antes, despues, nombre) {
  const n = s.split(antes).length - 1;
  if (n !== 1) { console.log('ABORTADO: no encontré el texto esperado (' + nombre + ', coincidencias: ' + n + '). No se cambió nada. Mándame el index.html.'); process.exit(1); }
  s = s.replace(antes, () => despues);
}

// 1) Quitar y aplicar los pendientes en un solo paso, DESPUÉS de leer (así dos ejecuciones a la vez no se duplican)
cambiar(
`    // 1) quitar lo aplicado antes (para no duplicar si se vuelve a ejecutar)
    var prev = window._pendAplicado || {};
    Object.keys(prev).forEach(function(k){ imsInventario[k] = (imsInventario[k] || 0) - prev[k]; });
    window._pendAplicado = {};
    // 2) leer los PENDING recientes
`,
`    // 1) leer los PENDING recientes
`, 'quitar-antes');

cambiar(
`    var snap = await db.collection('pallets_medio').where('status','==','PENDING').get();
`,
`    var snap = await db.collection('pallets_medio').where('status','==','PENDING').get();
    // 2) quitar lo aplicado antes y aplicar lo nuevo SIN pausas de por medio (evita sumar dos veces si hay dos lecturas a la vez)
    var prev = window._pendAplicado || {};
    Object.keys(prev).forEach(function(k){ imsInventario[k] = (imsInventario[k] || 0) - prev[k]; });
    window._pendAplicado = {};
`, 'leer-pending');

// 2) Una sola lectura de inventario a la vez
cambiar(`function sincIMSFresco(auto) {`, `function _sincIMSFrescoReal(auto) {`, 'nombre-sync');
cambiar(`window.sincIMSFresco = sincIMSFresco;`,
`// Una sola lectura de inventario a la vez: si ya hay una en curso, el ciclo automático la reutiliza y el manual espera a que termine
function sincIMSFresco(auto) {
  if (window._sincIMSEnCurso) {
    if (auto === true) return window._sincIMSEnCurso;
    return window._sincIMSEnCurso.then(function () { return sincIMSFresco(auto); });
  }
  var p = _sincIMSFrescoReal(auto);
  window._sincIMSEnCurso = p;
  var libre = function () { if (window._sincIMSEnCurso === p) window._sincIMSEnCurso = null; };
  p.then(libre, libre);
  return p;
}
window.sincIMSFresco = sincIMSFresco;`, 'wrapper');

if (crlf) s = s.replace(/\n/g, '\r\n');
fs.writeFileSync('index.antes-parche-pendientes.html', fs.readFileSync(ruta));
fs.writeFileSync(ruta, s);
console.log('LISTO. Parche aplicado a ' + ruta + ' (respaldo: index.antes-parche-pendientes.html en esta carpeta).');
