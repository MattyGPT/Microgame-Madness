const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadPyodide} = require('pyodide');

test('packaged Python runs in WebAssembly without desktop dependencies', async () => {
  const py = await loadPyodide();
  py.FS.mkdir('/game');
  const root = path.resolve(__dirname, '../../dist');
  for(const file of JSON.parse(fs.readFileSync(path.join(root,'python-files.json')))) {
    py.FS.writeFile(`/game/${file}`, fs.readFileSync(path.join(root,'python',file)));
  }
  py.runPython("import sys\nsys.path.insert(0, '/game')\nfrom bridge import handle");
  const handle = py.globals.get('handle');
  for(const [mode,difficulty] of [['hangman','easy'],['keyboard','progressive'],['dodge','merciless'],['boss','impossible'],['pumpkin','phase2']]) {
    let state = JSON.parse(handle(JSON.stringify({action:'start',mode,difficulty,now:0})));
    assert.equal(state.mode,mode);
    for(let frame=0;frame<90;frame++) {
      state=JSON.parse(handle(JSON.stringify({action:'tick',dt:1/60,now:frame/60,keys:['Left','f']})));
      assert.equal(typeof state.score,'number');
    }
    if(['dodge','boss','pumpkin'].includes(mode))assert.ok(state.commands.length);
  }
  assert.equal(py.runPython("'tkinter' in sys.modules or 'turtle' in sys.modules"),false);
  handle.destroy();
});
