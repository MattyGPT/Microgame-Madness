"use strict";
const CoinDropLessons = (() => {
  // Short, game-specific lessons are separate from timed challenges and never award currency.
  const notes = {
    timing:['Watch the marker move across the bar. The gold area is the safe stopping zone.','Wait until the marker is inside gold, then press Stop marker once.','A stop in the middle of gold wins; stopping outside it loses.'],
    memory:['Look at all four symbols during the 3-second preview. Read them from left to right.','Say the sequence to yourself, then press the matching symbols in the same order.','★ ◆ ● ☾ means press star, diamond, circle, moon.'],
    stars:['Find the star button and catch it five times. It changes position after every catch.','Move your eyes to its new location before clicking again. Keyboard users can focus the star and activate it.','The counter must reach 5 before the 10-second timer ends.'],
    math:['Addition joins two amounts together. Start with the larger number and count up by the smaller number.','For a faster mental calculation, make a group of ten first. You have 4 seconds in Quick Cash.','8 + 5 = 8 + 2 + 3 = 13.'],
    odd:['Most coins have a solid blue Cubie Cash face. Exactly one is a hollow ring.','Scan the grid row by row and select the hollow ring instead of a C coin. You have 3 seconds.','In ● ● ○, the third coin is the odd one out.'],
    colors:['Read the requested color name before looking at the parcels.','Choose the button with the matching name. This is a fast 2-second challenge.','If the request is Mint, choose Mint.'],
    reaction:['The button begins on WAIT. Pressing during WAIT loses immediately.','Keep watching until it says GO, then press within one second.','Waiting is part of the challenge: an early press is not a head start.'],
    maze:['Move the Cubie Cash coin one square at a time using arrow keys or the on-screen arrows. The ruby is your goal.','Plan the path before moving. Striped walls and the outside edge cause instant failure; the timer is 6 seconds.','A clear route can turn corners. Move only into an empty square or the ruby.'],
    code:['The three-digit code appears for only 1 second. Read it from left to right.','Remember it as one short phrase, then use the keypad to enter the same digits in order.','For 2 6 1, press 2, then 6, then 1.'],
    rhythm:['This is a three-hit timing challenge. Every hit must land inside the gold zone.','Let the marker make another pass between hits; rapid repeated clicks do not count.','Three accurate stops win. One stop outside gold loses.'],
    change:['Subtraction finds how much is left after spending or removing some of an amount.','Count backward, or ask what you must add to the price to reach the starting amount.','17 − 6 = 11, because 6 + 11 = 17.'],
    multiply:['Multiplication means equal groups. The first number tells how many are in each group.','Use repeated addition or a multiplication fact you know.','4 × 3 = 4 + 4 + 4 = 12.'],
    divide:['Division splits a total into equal groups.','Use the inverse multiplication fact: what number times the bag count makes the total?','20 dots ÷ 4 bags = 5 dots per bag, because 5 × 4 = 20.'],
    even:['Even numbers can be split into two equal whole-number groups.','Look at the final digit: 0, 2, 4, 6 and 8 mean even.','18 is even. 17 is odd.'],
    prime:['A prime number is a whole number greater than 1 with exactly two positive divisors: 1 and itself.','Small primes include 2, 3, 5, 7, 11, 13 and 17. The number 1 is not prime.','7 is prime. 9 is not: 9 = 3 × 3.'],
    fraction:['A fraction describes part of a whole. The top number counts parts; the bottom number tells how many equal parts make the whole.','Compare using a common denominator, or cross-multiply the positive fractions.','Compare 2/3 and 3/4: 2 × 4 = 8, while 3 × 3 = 9. So 3/4 is larger.'],
    clock:['The short gold hand shows hours. The long blue hand shows minutes.','Each clock number is five minutes for the long hand. When the short hand is between numbers, use the hour it has passed.','Long hand at 3 means :15; at 6 means :30; at 9 means :45. Short hand between 4 and 5 with long hand at 6 means 4:30.'],
    roman:['Roman numerals use letters instead of place-value digits. Learn I = 1, V = 5 and X = 10 first.','Add symbols that go from larger to smaller. A smaller symbol immediately before a larger one can subtract, as in IV and IX.','VI = 5 + 1 = 6. IV = 5 − 1 = 4. IX = 10 − 1 = 9.'],
    binary:['Binary uses only 0 and 1. In a four-bit number, the places from left to right are worth 8, 4, 2 and 1.','A 1 turns its place value on. A 0 leaves it off. Add only the values underneath the 1s.','1010 = 8 + 0 + 2 + 0 = 10. It is not one thousand and ten.'],
    count:['Count only stars, not moons.','Scan from left to right, keeping a running count whenever you see ★.','★ ☾ ★ ★ contains 3 stars.'],
    missing:['Look at the gap between neighboring numbers. In this game, the same amount is added each time.','Find the step, then add it once more to the last visible number.','4, 7, 10, ? increases by 3, so the next number is 13.'],
    mirror:['A horizontal mirror swaps left and right while keeping up and down unchanged.','Imagine a vertical mirror. Use the buttons, or hold one up/down arrow key with one left/right arrow key and release to choose a diagonal.','↗ becomes ↖. The upward part stays upward.'],
    opposite:['This game uses two opposite-color pairs: red with green, and blue with orange.','Choose the other member of the requested color’s pair.','The opposite of Blue is Orange; the opposite of Green is Red.'],
    sides:['Count the straight edges around the shape. Each corner meets two sides.','Triangle: 3. Square: 4. Pentagon: 5. Hexagon: 6.','A hexagon has 6 sides, even when it is drawn as a solid shape.'],
    word:['Alphabetical order compares words letter by letter.','If the first letters match, compare the next letters until they differ.','Cat comes before Cot because a comes before o. Coin comes before Comet because i comes before m.'],
    weight:['Both sides of the equation must have the same value.','Subtract the known weight from the total to find the missing weight.','6 + ? = 11 means ? = 11 − 6 = 5.'],
    ascending:['Ascending means increasing: start small and finish large.','Find the smallest unused number each time. A correct pick is removed from play.','3, 11, 6 becomes 3 → 6 → 11.'],
    descending:['Descending means decreasing: start large and finish small.','Find the largest unused number each time.','3, 11, 6 becomes 11 → 6 → 3.'],
    alphabet:['Use normal alphabetical order, from A toward Z.','Find the earliest remaining letter and select it.','M, B, J becomes B → J → M.'],
    week:['The game asks for the five weekdays, beginning with Monday.','Use Monday → Tuesday → Wednesday → Thursday → Friday.','Thursday goes after Wednesday and before Friday.'],
    rainbow:['This challenge uses the first five colors in this order: red, orange, yellow, green, blue.','Remember the order before tapping. Do not sort the color names alphabetically.','Yellow comes between Orange and Green.'],
    size:['Compare the actual size of each circle, not its position.','Pick the smallest circle first, then work up to the largest.','A small circle on the right still comes before a large circle on the left.'],
    compass:['On a compass, north is up, east is right, south is down and west is left.','Use buttons or arrow keys: ↑ North → East ↓ South ← West, going clockwise from north.','Clockwise turns right around the compass, like a clock hand.'],
    months:['Use calendar order, starting with the earliest month shown.','January, February, March, April, May, June, July, August, September, October, November, December.','March comes before June, which comes before September.'],
    reverse:['Study the four digits for 2 seconds. You will enter them in reverse order.','Start with the last digit you saw and work backward to the first.','2 5 1 4 must be entered as 4 1 5 2.'],
    missing_memory:['Study all four symbols during the 2-second preview. One will disappear.','Compare the remaining three against your memory and select the missing symbol.','If ★ ◆ ● ☾ becomes ★ ● ☾, choose ◆.'],
    location:['One locker is marked during the 1-second preview. Remember its position.','Think in rows and columns rather than trying to remember the whole grid.','“Middle row, right column” identifies one locker even after its gem disappears.'],
    pairs:['Each symbol has exactly one matching partner. Flip two cards to look for a pair.','Remember both the symbol and its position. A mismatch closes after a short delay.','If the top-left card is a star, return to it when you discover the other star.'],
    flash:['Watch the light brighten and dim. Count each bright flash once.','Do not count the dim gaps as extra flashes. Answer only after the display finishes.','Bright, dim, bright, dim, bright is 3 flashes.'],
    reverse_arrows:['Remember the arrow sequence during the 2-second preview.','Reverse the order, not the arrow directions. After the preview, use the matching arrow keys or buttons.','↑ → ↓ must be entered as ↓ → ↑, not as flipped arrows.'],
    edge:['The safe gold zone is near the right end of the bar.','Watch one approach, then stop while the marker is inside the gold area.','Stopping near the center will lose this challenge; the target is on the right.'],
    left:['The safe gold zone is near the left end of the bar.','Wait for the marker to reach the left-hand gold area before stopping.','Do not reuse the center timing from Golden Stop.'],
    orbit:['The white satellite circles around the ring. The green arc is the locking zone.','Press Lock when the satellite enters the green arc near the bottom.','Wait for another orbit if you miss the first approach; clicking outside the arc loses.'],
    windows:['This bar has two separate gold windows. Either one is safe.','Choose the window that the marker is approaching and stop inside it.','The dark space between the two windows is not safe.'],
    brake:['The marker accelerates as it travels. Gold is near the center.','Watch its current speed rather than assuming every pass takes the same time.','Press Brake while inside gold; an early or late stop loses.'],
    lights:['Pressing a light toggles it and its immediate up, down, left and right neighbors. Diagonal lights do not change.','Toggling means on becomes off and off becomes on. The goal is for every light to be off.','Pressing the same light twice undoes that pair of presses. Plan groups of moves instead of chasing a single light.'],
    slide:['Only a tile directly beside the empty square can slide into it. Diagonal moves do not work.','Arrow keys move the empty square; buttons slide a tile. Finish in order: 1, 2, 3 / 4, 5, 6 / 7, 8, empty.','To move the empty square downward, select the tile directly below it.'],
    wires:['Clicking a wire rotates its arrow a quarter-turn clockwise.','Make all four arrows point right. Use ←/→ to select a wire, ↑ to rotate clockwise, or ↓ to rotate counterclockwise.','A wire pointing ↓ needs three clockwise turns, or one counterclockwise turn, to point →.'],
    path:['The safe route is labeled with the numbers 1 through 5.','Select 1, then 2, then 3, then 4, then 5. A wrong square loses immediately.','A square marked × is never part of the route.'],
    mines:['Gems are marked ◆. Bombs are marked ✹.','Collect every gem and avoid every bomb. Look at the symbol before tapping.','A bomb does not merely reduce your score: it ends this nanogame.'],
    sum:['Select a group of numbers whose total is exactly 10.','Select a number again to remove it. Bank the total only when it reads 10.','2 + 8 = 10 and 3 + 7 = 10. A total of 11 is too high.'],
    taps:['Tap the coin exactly seven times, then press Bank seven.','Count each tap; the eighth tap loses immediately. The bank button does not count as a coin tap.','Count silently: one, two, three, four, five, six, seven. Then stop and bank it; there is no tap counter.'],
    alternate:['Begin with LEFT, then switch sides after every press.','Use buttons or the ← and → keys. Complete eight presses: LEFT, RIGHT, LEFT, RIGHT, LEFT, RIGHT, LEFT, RIGHT.','Pressing the same side twice in a row loses.'],
    hold:['Hold the valve button, or hold Space, for between 1 and 1.5 seconds.','Release while inside that time window. Releasing too early or holding too long loses.','A 1.2-second hold is safe. A 0.5-second hold is too short.'],
    signal:['Only green GO signals are safe. Red WAIT signals are traps.','Collect three green signals. Each signal accepts one press, then you must wait for another.','Clicking repeatedly after one good press can hit the following WAIT state and lose.'],
    catch:['The comet ☄ moves continuously. The moon buttons ☾ are decoys.','Catch the comet three times without touching a moon. Aim ahead of its movement if needed.','A successful catch increases the counter; touching a decoy ends the game.'],
    shield:['Match the direction of the incoming arrow with the same shield direction.','Use the arrow buttons or your keyboard arrows. Block four attacks.','An incoming ↑ needs the ↑ shield, not the opposite arrow.'],
    arrows:['Match each displayed arrow using an arrow button or keyboard arrow.','The command changes after each correct press. Finish all five.','Read the new arrow before pressing again, even if the last two matched.'],
    balance:['Move the slider so its value stays inside the moving green band.','Stay inside for 2 continuous seconds. Leaving the band resets the steady-time counter.','Follow the band smoothly; sitting at the center forever will not track its movement.'],
    stopwatch:['Start the hidden clock, then stop it between 2.5 and 3.5 seconds later.','Count a steady “one, two, three” in your head. The clock is deliberately not displayed.','Stopping about 3 seconds after Start wins. The overall nanogame still has an 8-second limit.'],
  };
  const romanKey=[['I','1'],['II','2'],['III','3'],['IV','4'],['V','5'],['VI','6'],['VII','7'],['VIII','8'],['IX','9'],['X','10']];
  function get(game){
    const key=game.variant||game.id,entry=notes[key];if(!entry)throw new Error(`Missing lesson: ${game.id}`);
    return {key,title:key==='binary'?'Binary: the 8–4–2–1 code':key==='roman'?'Roman numerals key':`Learn ${game.title}`,steps:entry.slice(0,2),example:entry[2],reference:key==='roman'?romanKey:null};
  }
  function binaryValue(bits){return bits.reduce((total,bit,i)=>total+(bit?[8,4,2,1][i]:0),0);}
  function render(host,game){
    const lesson=get(game),element=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
    host.replaceChildren();host.append(element('h4',lesson.title),element('p','Take your time. The game timer and music start only when you press Start nanogame.','cd-lesson-note'));
    const steps=element('ol');lesson.steps.forEach(step=>steps.append(element('li',step)));host.append(steps);
    const example=element('div',undefined,'cd-lesson-example');example.append(element('strong','Worked example'),element('p',lesson.example));host.append(example);
    if(lesson.key==='binary'){
      host.append(element('h5','Try the switches'),element('p','Tap a bit to switch it between 0 and 1. The numbers above are its place values.'));
      const bits=[1,0,1,0],grid=element('div',undefined,'cd-binary-demo'),total=element('p',undefined,'cd-lesson-answer');total.setAttribute('role','status');total.setAttribute('aria-live','polite');
      const update=()=>{grid.querySelectorAll('button').forEach((b,i)=>{b.textContent=String(bits[i]);b.setAttribute('aria-pressed',String(!!bits[i]));b.setAttribute('aria-label',`${[8,4,2,1][i]} place: ${bits[i]}`);});const on=[8,4,2,1].filter((_,i)=>bits[i]);total.textContent=`${bits.join('')} = ${on.length?on.join(' + '):'0'} = ${binaryValue(bits)}`;};
      [8,4,2,1].forEach((value,i)=>{const cell=element('div'),label=element('span',String(value)),button=element('button');button.type='button';button.dataset.bit=String(i);button.onclick=()=>{bits[i]=1-bits[i];update();};cell.append(label,button);grid.append(cell);});host.append(grid,total);update();
    }
    if(lesson.reference){
      const table=element('table',undefined,'cd-roman-key'),caption=element('caption','Quick reference: 1–10'),head=element('thead'),row=element('tr');row.append(element('th','Roman'),element('th','Value'));for(const th of row.children)th.scope='col';head.append(row);table.append(caption,head);const body=element('tbody');for(const [roman,value]of lesson.reference){const r=element('tr');r.append(element('td',roman),element('td',value));body.append(r);}table.append(body);host.append(table);
      host.append(element('p','Remember: IV subtracts 1 from 5; IX subtracts 1 from 10. This game uses numerals from III through IX.'));
    }
  }
  return {get,render,binaryValue,romanKey};
})();
if(typeof module!=='undefined')module.exports=CoinDropLessons;
