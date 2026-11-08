// Rebuild the welcome montage from the real attack simulation and renderer.
import { chromium } from '@playwright/test';
import { spawn, execFileSync } from 'node:child_process';
import { gunzipSync } from 'node:zlib';
import { once } from 'node:events';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const frames = JSON.parse(gunzipSync(execFileSync('python3', ['-c', String.raw`
import json, random, sys, gzip
sys.path.insert(0, 'web')
from bridge import DrawCanvas
from kings_wrath import KingsWrath, WRATH_ATTACKS
from pumpkin_king import ATTACK_NAMES
from pumpkin_king_view import KingView
frames = []
for attack, index in WRATH_ATTACKS.items():
    game = KingsWrath(attack, rng=random.Random(42))
    game._next_stage() # Omit the practice countdown from the attack montage.
    if attack == 'haunted_quadrants':
        game._next_stage() # Show the actual quadrant hazards.
    canvas = DrawCanvas()
    view = KingView(canvas, audio=False)
    for tick in range(90):
        game.invulnerable = 10
        game.update(1/30, {'Right'} if (tick // 30) % 2 == 0 else {'Left'})
        if tick < 30:
            continue # Let projectiles reach the arena before recording.
        view.draw(game)
        frames.append({'commands': canvas.commands(), 'x': game.x, 'y': game.y,
                       'label': ATTACK_NAMES[index]})
sys.stdout.buffer.write(gzip.compress(json.dumps(frames).encode()))
`], {maxBuffer: 100 * 1024 * 1024})));
const browser = await chromium.launch({headless: true});
try {
  const page = await browser.newPage({viewport: {width:640, height:480}});
  await page.setContent('<canvas width="640" height="480"></canvas>');
  const encoder = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', '30', '-i', 'pipe:0', '-an', '-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-pix_fmt', 'yuv420p', 'web/accounts/tours/wrath.webm'], {stdio:['pipe','inherit','inherit']});
  const done = once(encoder, 'close');
  for (const [index, frame] of frames.entries()) {
    const data = await page.evaluate(frame => {
      const canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
      ctx.fillStyle = '#111827'; ctx.fillRect(0,0,640,480);
      ctx.save(); ctx.translate(320,240);
      for (const command of frame.commands) {
        const c = command.coords;
        ctx.fillStyle = command.fill || '#ffffff';
        ctx.strokeStyle = command.outline || '#ffffff';
        ctx.lineWidth = command.width || 1;
        ctx.beginPath();
        if (command.kind === 'rectangle') ctx.rect(c[0],c[1],c[2]-c[0],c[3]-c[1]);
        else if (command.kind === 'oval') ctx.ellipse((c[0]+c[2])/2,(c[1]+c[3])/2,Math.abs(c[2]-c[0])/2,Math.abs(c[3]-c[1])/2,0,0,Math.PI*2);
        else if (command.kind === 'polygon') {
          ctx.moveTo(c[0],c[1]);
          for (let i=2;i<c.length;i+=2) ctx.lineTo(c[i],c[i+1]);
          ctx.closePath();
        } else if (command.kind === 'text') {
          ctx.font = `bold ${command.font?.[1] || 18}px Arial`;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(command.text,c[0],c[1]); continue;
        }
        if(command.fill) ctx.fill();
        if(command.outline) ctx.stroke();
      }
      ctx.fillStyle='#a3ff80'; ctx.beginPath();
      ctx.moveTo(frame.x,-frame.y-10); ctx.lineTo(frame.x-8,-frame.y+8); ctx.lineTo(frame.x+8,-frame.y+8); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle='#111827e8'; ctx.fillRect(0,448,640,32);
      ctx.fillStyle='#a4f4ff'; ctx.font='bold 17px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(frame.label,320,464);
      return {png:canvas.toDataURL('image/png').split(',')[1], poster:canvas.toDataURL('image/webp').split(',')[1]};
    }, frame);
    if(index===0) writeFileSync('web/accounts/tours/wrath.webp', Buffer.from(data.poster,'base64'));
    if(!encoder.stdin.write(Buffer.from(data.png,'base64'))) await once(encoder.stdin,'drain');
  }
  encoder.stdin.end();
  const [code] = await done;
  if(code !== 0) throw new Error(`Video encoder exited with ${code}`);
  console.log(`Built ${frames.length} frames: seven attacks, two seconds each.`);
} finally { await browser.close(); }
