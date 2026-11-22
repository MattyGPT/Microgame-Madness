'use strict';
// Promise-based confirmations shared by the arcade. Never blocks the game thread.
(() => {
 const dialog=document.createElement('dialog');dialog.id='game-confirm-dialog';dialog.className='game-confirm-dialog';dialog.setAttribute('aria-labelledby','game-confirm-title');dialog.setAttribute('aria-describedby','game-confirm-message');
 dialog.innerHTML='<form method="dialog"><p class="game-confirm-eyebrow">MICROGAME MADNESS</p><h2 id="game-confirm-title"></h2><p id="game-confirm-message"></p><div class="game-confirm-actions"><button value="cancel" autofocus>Cancel</button><button id="game-confirm-accept" value="accept">Continue</button></div></form>';
 document.body.append(dialog);let chain=Promise.resolve();
 function ask({title='Are you sure?',message,acceptLabel='Continue',danger=false}){
  const run=()=>new Promise(resolve=>{
   const opener=document.activeElement;dialog.returnValue='cancel';dialog.dataset.danger=String(danger);
   dialog.querySelector('h2').textContent=title;dialog.querySelector('#game-confirm-message').textContent=message;dialog.querySelector('#game-confirm-accept').textContent=acceptLabel;
   dialog.addEventListener('close',()=>{const accepted=dialog.returnValue==='accept';if(opener?.isConnected)opener.focus({preventScroll:true});resolve(accepted);},{once:true});
   dialog.showModal();dialog.querySelector('[value="cancel"]').focus();
  });
  const result=chain.then(run);chain=result.catch(()=>{});return result;
 }
 globalThis.ArcadeDialogs={ask};
})();
