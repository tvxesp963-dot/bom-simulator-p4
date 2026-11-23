// Agrega al index.html del BOM Simulator la línea que carga el módulo Pulp Tray.
// Uso (desde la carpeta raíz del proyecto, NO desde public):  node agregar-pulp-tray.js
const fs = require('fs'), path = require('path');
const archivo = path.join('public', 'index.html');
if (!fs.existsSync(archivo)) { console.log('NO ENCONTRADO: ' + archivo + ' (ejecuta este comando desde la carpeta raíz del proyecto)'); process.exit(1); }
if (!fs.existsSync(path.join('public', 'pulp-tray.js'))) { console.log('NO ENCONTRADO: public\\pulp-tray.js (cópialo a la carpeta public primero)'); process.exit(1); }
let s = fs.readFileSync(archivo, 'utf8');
if (s.includes('pulp-tray.js')) { console.log('YA ESTABA: index.html ya carga pulp-tray.js, no se cambió nada.'); process.exit(0); }
const i = s.lastIndexOf('</body>');
if (i < 0) { console.log('NO ENCONTRADO: </body> en index.html. No se cambió nada.'); process.exit(1); }
s = s.slice(0, i) + '<script src="pulp-tray.js"></script>\n' + s.slice(i);
fs.writeFileSync(archivo, s, 'utf8');
console.log('OK: index.html ahora carga pulp-tray.js');
