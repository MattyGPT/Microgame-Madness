const {test,expect,openGame}=require('./fixtures/game.cjs');
test.beforeEach(async({page})=>{await openGame(page);await page.locator('[data-game="nanolab"]').click();});
test('nanogame music starts on Start, is audible, follows mute and stops on close',async({page})=>{
 await page.locator('[data-nano-test="timing"]').click();
 expect(await page.evaluate(()=>coinDropGame.nanoMusic?.playing??false)).toBe(false);
 await page.locator('#cd-nano-start').click();
 await expect.poll(()=>page.evaluate(()=>coinDropGame.nanoMusic?.playing)).toBe(true);
 expect(await page.evaluate(()=>coinDropGame.nanoMusic.song.id)).toBe('timing');
 await page.evaluate(()=>{const g=coinDropGame;window.nanoAnalyser=g.audio.createAnalyser();nanoAnalyser.fftSize=512;g.nanoMusic.output.connect(nanoAnalyser);});
 await expect.poll(()=>page.evaluate(()=>{const samples=new Float32Array(512);nanoAnalyser.getFloatTimeDomainData(samples);return samples.some(n=>Math.abs(n)>.0001);})).toBe(true);
 await page.evaluate(()=>setSoundEnabled(false));await expect.poll(()=>page.evaluate(()=>coinDropGame.nanoMusic.output.gain.value)).toBe(0);expect(await page.evaluate(()=>coinDropGame.nanoMusic.voices.size)).toBe(0);
 await page.evaluate(()=>setSoundEnabled(true));await expect.poll(()=>page.evaluate(()=>coinDropGame.nanoMusic.playing)).toBe(true);
 await page.locator('#cd-nano-skip').click();expect(await page.evaluate(()=>({song:coinDropGame.nanoMusic.song,voices:coinDropGame.nanoMusic.voices.size,gain:coinDropGame.nanoMusic.output.gain.value}))).toEqual({song:null,voices:0,gain:0});
});
test('switching tests, hidden tabs, timeouts and silent starts never leave music behind',async({page})=>{
 await page.locator('[data-nano-test="memory"]').click();await page.locator('#cd-nano-start').click();await expect.poll(()=>page.evaluate(()=>coinDropGame.nanoMusic.playing)).toBe(true);
 const hidden=await page.evaluate(()=>{const g=coinDropGame,elapsed=g.nano.elapsed;Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));g.tickNano(2);g.syncNanoMusic();return {elapsed:g.nano.elapsed,previous:elapsed,voices:g.nanoMusic.voices.size,gain:g.nanoMusic.output.gain.value};});
 expect(hidden.elapsed).toBe(hidden.previous);expect(hidden.voices).toBe(0);expect(hidden.gain).toBe(0);
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await expect.poll(()=>page.evaluate(()=>coinDropGame.nanoMusic.playing)).toBe(true);
 await page.locator('#cd-nano-skip').click();await page.locator('[data-nano-test="nano_wires"]').click();await page.locator('#cd-nano-start').click();await expect.poll(()=>page.evaluate(()=>coinDropGame.nanoMusic.song?.id)).toBe('nano_wires');
 await page.evaluate(()=>coinDropGame.tickNano(11));expect(await page.evaluate(()=>coinDropGame.nanoMusic.song)).toBe(null);
 await page.evaluate(()=>setSoundEnabled(false));await page.locator('[data-nano-test="colors"]').click();await page.locator('#cd-nano-start').click();expect(await page.evaluate(()=>coinDropGame.nanoMusic.voices.size)).toBe(0);await page.locator('#cd-nano-skip').click();
 await page.locator('[data-game="shop"]').click();expect(await page.evaluate(()=>coinDropGame.nanoMusic.playing)).toBe(false);
});
test('every score renders real, finite, distinct PCM audio',async({page})=>{
 const results=await page.evaluate(async()=>{
   const out=[];
   for(const game of CoinDrop.nanogames){const song=CoinDropNanoMusic.score(game),ctx=new OfflineAudioContext(1,Math.ceil((song.duration+1)*16000),16000),gain=ctx.createGain();gain.gain.value=.12;gain.connect(ctx.destination);
     song.beats.forEach((notes,i)=>notes.forEach(note=>CoinDropNanoMusic.voice(ctx,gain,note,i*song.step+.01)));
     const pcm=(await ctx.startRendering()).getChannelData(0);let sum=0,peak=0,hash=0;
     for(let i=0;i<pcm.length;i++){sum+=pcm[i]**2;peak=Math.max(peak,Math.abs(pcm[i]));if(i%31===0)hash=Math.imul(hash^Math.round(pcm[i]*1e6),16777619);}
     out.push({id:game.id,rms:Math.sqrt(sum/pcm.length),peak,hash});
   }return out;
 });
 expect(results).toHaveLength(60);expect(new Set(results.map(r=>r.hash)).size).toBe(60);
 for(const r of results){expect(r.rms,r.id).toBeGreaterThan(.0001);expect(r.peak,r.id).toBeLessThan(.5);expect(Number.isFinite(r.rms),r.id).toBe(true);}
});
