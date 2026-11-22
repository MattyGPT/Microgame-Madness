# Balloon Pop

Open http://localhost:8777/balloon-pop/index.html after `npm run accounts:build-preview`.
This game ships in every public build as Microgame 16.

Click or tap balloons. Five escaped balloons end a run. P pauses/resumes and M toggles audio. A hidden tab automatically pauses the countdown or run.

Normal ×1; Hard ×2 (yellow, faster sway); Merciless ×3 (smaller red balloons); Impossible ×4 (smallest balloons and a wider playfield). Each mode has an original synthesized musical arrangement. All start with five lives. Spawn intervals and rise speed increase throughout the run.

A pop earns 10 points. Pop within 0.8 seconds of spawn for +5. Chain pops within 1.35 seconds: every five in the combo adds +3 per pop, capped at +20. Every twelfth balloon is a star worth +25. Empty clicks break the combo. Local high scores use raw points × mode multiplier. No public leaderboard submissions are made.

Run simulation checks with `node --test web/balloon-pop/model.test.cjs`.
