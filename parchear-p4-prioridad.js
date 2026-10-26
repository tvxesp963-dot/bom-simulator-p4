// Parche v2: cuando un número de parte existe en IMS P3 y en IMS P4, el inventario de P4 siempre debe ganar
// (antes ganaba el que llegara último de Firebase y un Set Pad con 0 en P3 tapaba las 4,042 de P4).
// Uso: node parchear-p4-prioridad-v2.js   (dentro de la carpeta 12. bom-simulator-deploy)
const fs = require('fs');
const ruta = 'public/index.html';
if (!fs.existsSync(ruta)) { console.log('NO ENCUENTRO ' + ruta + '. Corre este comando dentro de la carpeta 12. bom-simulator-deploy'); process.exit(1); }
let s = fs.readFileSync(ruta, 'utf8');
const crlf = s.indexOf('\r\n') >= 0;
if (crlf) s = s.replace(/\r\n/g, '\n');
if (s.indexOf('vistoP4') >= 0) { console.log('Este parche YA estaba aplicado. No se cambió nada.'); process.exit(0); }

const antes =
`    Promise.all(colsSync.map(function(c) {
      return db.collection(c.col).get().then(function(snap) {
        docsLocal += snap.size || 0; detalle[c.planta] = snap.size || 0;
        snap.forEach(function(doc) {
          var d = doc.data();
          if (!d.pn) return;
          var pn = d.pn.trim().toUpperCase();
          var desc = (d.desc||'').trim().toUpperCase();
          var actual = invActualIMS(d); // mismo campo que muestran los IMS
          var keyPlanta = pn + '||PLANTA:' + c.planta;
          invLocal[keyPlanta] = (invLocal[keyPlanta]||0) + actual;
          if (c.planta === 'P3') {
            invLocal[pn] = actual;
          } else {
            invLocal[pn] = (invLocal[pn]||0) + actual;
          }
          if (desc) {
            invLocal[pn+'||'+desc] = actual;
            invLocal[pn+'||'+desc+'||PLANTA:'+c.planta] = actual;
          }
        });
      }).catch(function(e){ errLocal = (e && (e.code || e.message)) || 'error'; detalle[c.planta] = 'error'; });
    })).then(async function() {
      const ok = !errLocal && docsLocal > 0;`;

const despues =
`    Promise.all(colsSync.map(function(c) {
      return db.collection(c.col).get().then(function(snap) {
        docsLocal += snap.size || 0; detalle[c.planta] = snap.size || 0;
        var docs = []; snap.forEach(function(doc) { docs.push(doc.data()); });
        return { planta: c.planta, docs: docs };
      }).catch(function(e){ errLocal = (e && (e.code || e.message)) || 'error'; detalle[c.planta] = 'error'; return { planta: c.planta, docs: [] }; });
    })).then(async function(res) {
      // Orden fijo: primero P3 y al final P4, para que P4 SIEMPRE gane cuando un PN existe en las dos plantas
      // (antes ganaba el que llegara último de Firebase y un Set Pad con 0 en P3 tapaba el inventario de P4)
      var ordenado = res.slice().sort(function(a, b) { return (a.planta === 'P3' ? 0 : 1) - (b.planta === 'P3' ? 0 : 1); });
      var vistoP4 = {};
      ordenado.forEach(function(r) {
        r.docs.forEach(function(d) {
          if (!d.pn) return;
          var pn = d.pn.trim().toUpperCase();
          var desc = (d.desc||'').trim().toUpperCase();
          var actual = invActualIMS(d); // mismo campo que muestran los IMS
          var keyPlanta = pn + '||PLANTA:' + r.planta;
          invLocal[keyPlanta] = (invLocal[keyPlanta]||0) + actual;
          if (r.planta === 'P3') {
            invLocal[pn] = actual;
          } else {
            invLocal[pn] = vistoP4[pn] ? ((invLocal[pn]||0) + actual) : actual;
            vistoP4[pn] = true;
          }
          if (desc) {
            invLocal[pn+'||'+desc] = actual;
            invLocal[pn+'||'+desc+'||PLANTA:'+r.planta] = actual;
          }
        });
      });
      const ok = !errLocal && docsLocal > 0;`;

const n = s.split(antes).length - 1;
if (n !== 1) { console.log('ABORTADO: no encontré el texto esperado (coincidencias: ' + n + '). No se cambió nada. Mándame el index.html.'); process.exit(1); }
s = s.replace(antes, () => despues);
if (crlf) s = s.replace(/\n/g, '\r\n');
fs.writeFileSync('index.antes-parche-p4.html', fs.readFileSync(ruta));
fs.writeFileSync(ruta, s);
console.log('LISTO. Parche aplicado a ' + ruta + ' (respaldo: index.antes-parche-p4.html en esta carpeta).');
