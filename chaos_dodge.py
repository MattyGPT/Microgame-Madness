"""Chaos-only block catalog and simulation; classic Turtle Dodge stays unchanged."""
import math
from fractions import Fraction

# One source for the in-game guide, spawn weights, colors and identifying glyphs.
BLOCK_TYPES = (
    ('coin_flip', 'Coin Flip', '#f4d37b', '+/-', 2, 'Rare', 'One roll on contact: 50% chance to heal 2 HP (up to 8), or 50% chance to take 2 damage. Shields and contact protection can block the damage. Consumed after the roll.'),
    ('all_or_nothing', 'All or Nothing', '#d49cfa', 'A/N', 1, 'Very rare', 'One roll on contact: 50% chance to restore all missing HP, or 50% chance to die instantly, even through shields and protection. Healing does not clear status effects. Consumed after the roll.'),
    ('second_wind', 'Second Wind', '#65f2ba', 'SW+', 2, 'Rare', 'A harmless pickup: grants Regeneration for 4 seconds, restoring 1 HP each second, up to 8 HP. Repeats refresh the duration without stacking. Natural healing continues separately.'),
    ('backdraft', 'Backdraft', '#f39368', 'BD!', 2, 'Rare', '1 contact damage, then burns for 1 damage after 2 and 4 seconds and makes falling blocks 40% faster for 3 seconds. A shield or contact protection prevents all effects.'),
    ('storm_shelter', 'Storm Shelter', '#8fb5f5', 'SH+', 2, 'Rare', 'A harmless pickup: grants 3 seconds of contact protection and immunity to pushing and pulling fields. Status damage and instant-kill hazards still hurt.'),
    ('normal', 'Wild block', '#63d9ed', 'W', 22, 'Common', '1 damage. Random color, size, speed, shape and sway.'),
    ('amber', 'Amber', '#efbe62', 'AM', 2, 'Rare', 'A harmless pickup: freezes all Blaster and turret pellets for 3 seconds, including newly fired pellets. Frozen pellets still hurt on contact. Collecting another refreshes the timer.'),
    ('anti_gravity', 'Anti-Gravity block', '#d3a0ef', 'AG', 8, 'Uncommon', 'Spawns below the arena and rises toward the top at Wild base speed. Random Wild-style shapes and sizes. 1 contact damage.'),
    ('target_lock', 'Target Lock', '#ee9c9c', 'TL', 3, 'Rare', 'A harmful collectible with no contact damage. For 6 seconds, every block steers horizontally toward you at up to 80 units per second.'),
    ('danger_edge', 'Danger Edge', '#ff6b83', 'DE', 3, 'Rare', 'A harmful collectible with no contact damage. For 6 seconds, touching an arena edge instantly ends the run, even through shields and protection.'),
    ('arena_shrink', 'Arena Shrink', '#c69be9', 'AS', 3, 'Rare', 'A harmful collectible with no contact damage. Shrinks the arena to Merciless size (440 by 360) for 3 seconds, then restores it.'),
    ('project_mayhem', 'Project Mayhem', '#ee8f72', 'PM', 1.5, 'Rare', 'A harmful collectible: shrinks the arena to Merciless size and makes its edges instantly lethal for 3 seconds. No contact damage.'),
    ('project_chaos', 'Project Chaos', '#ed83bf', 'PC', 1, 'Very rare', 'A harmful collectible: Target Lock, lethal edges and a Merciless-size arena together for 3 seconds. No contact damage.'),
    ('horizontal', 'Horizontal block', '#83c9ef', 'HZ', 15, 'Common', 'Enters from the left or right and travels across the arena at 50% of Wild base speed. Random Wild-style shapes and sizes. 1 contact damage. Stasis does not stop its sideways travel.'),
    ('wild_seven', 'Wild Seven block', '#63d9ed', '7', 0, 'Rare', '7 contact damage. Spawns 0.8% of the time. Same random colors, shapes, sizes, speeds and sway as Wild, identified by its 7 symbol. Shields and hit protection still work.'),
    ('gravity_well', 'Gravity Well block', '#b79aff', 'GW', 2.5, 'Rare', 'Pulls both you and nearby blocks inward within a large 300-unit ring. 1 contact damage. Repellent protects you from the pull.'),
    ('force_wave', 'Force Wave block', '#80e4db', 'FW', 2.5, 'Rare', 'Pushes both you and nearby blocks outward within a large 300-unit ring. 1 contact damage. Repellent protects you from the push.'),
    ('steaming', 'Steaming block', '#c7b6a6', 'SM', 4, 'Rare', '1 contact damage. Its small 60-unit steam radius poisons you: 1 damage every 3 seconds, lasting 9 seconds after you leave.'),
    ('electric', 'Electric block', '#ffe85b', 'EL', 4, 'Rare', '1 contact damage. Its small 60-unit radius grants Haste: 45% faster movement, lasting 4 seconds after you leave.'),
    ('stinky', 'Stinky block', '#a6c65c', 'SK!', 4, 'Rare', '1 contact damage. Its small 60-unit stink radius poisons you: 1 damage every 3 seconds, lasting 9 seconds after you leave.'),
    ('chilly', 'Chilly block', '#a5e8ff', 'CH', 4, 'Rare', '1 contact damage. Its small 60-unit radius applies Frost: half movement speed, lasting 2.5 seconds after you leave.'),
    ('ricochet_shield', 'Ricochet Shield', '#80f3d4', 'RS', 2, 'Rare', 'A harmless pickup: grants one shield and instantly reflects Blaster pellets within 140 units away from you. Reflected pellets turn mint green and cannot hurt you.'),
    ('blaster', 'Blaster block', '#d0a375', 'BL', 0, 'Uncommon', '5% of spawns. Falls at 75% of Normal base speed. Fires 0.5-damage pellets every 0.3–0.9 seconds. Starts with one of eight cannon directions; each extra cannon has a 40% chance, up to eight. 30% rotate slowly, equally likely clockwise or counterclockwise. Body contact deals 1 damage.'),
    ('giga_fan', 'Giga Fan', '#c69de5', 'GF', 2, 'Rare', 'Three enormous blades, each 8x the original Fan blade length. One rotation every 4 seconds. Body or blade contact deals 1 damage; the Giga Fan persists.'),
    ('fan', 'Fan block', '#9ebacb', 'FN', 4, 'Rare', 'One square with three extra-long spinning blades (3x their original length). One rotation every 3.75 seconds. Body or blade contact deals 1 damage; the fan persists.'),
    ('leafy', 'Leafy block', '#7ecb76', 'LF', 5, 'Uncommon', 'Wild-shaped, harmless and pass-through. Slows your movement by 50% only while overlapping it.'),
    ('turbo', 'Turbo block', '#ffd46b', 'TB', 5, 'Uncommon', 'Wild-shaped, harmless and pass-through. Speeds your movement up by 50% only while overlapping it.'),
    ('elite_leafy', 'Elite Leafy block', '#4eab79', 'ELF', 2, 'Rare', 'Wild-shaped, harmless and pass-through. Slows you and other blocks by 50% only while overlapping it. Its inside color changes every 0.1 seconds.'),
    ('elite_turbo', 'Elite Turbo block', '#f0a95c', 'ETB', 2, 'Rare', 'Wild-shaped, harmless and pass-through. Speeds you and other blocks up by 50% only while overlapping it. Its inside color changes every 0.1 seconds.'),
    ('spike', 'Spike', '#b8bcc9', 'SP', 5, 'Uncommon', 'Solid like Pusher, at the same speed. Its top spike deals 1 damage; sides and underside push harmlessly. Being pushed against a wall deals 1 damage.'),
    ('thunder', 'Thunder Block', '#343b4c', 'TH!', 4, 'Rare', 'You can pass through the cloud safely; touching it does not break it. Every second, yellow !!! marks give a 0.25-second warning before lightning strikes below for 0.25 seconds. The lightning is as wide as the cloud and twice its height. A hit deals 2 damage and gives you Haste for 1 second (45% faster movement).'),
    ('mystery', 'Mystery block', '#a6a6ad', '?', 5, 'Uncommon', 'A gray question-mark block. Reveals a random block when you come within 120 units. Can become any other block, including newly added types, but never another Mystery block.'),
    ('pusher', 'Pusher block', '#e6b45e', 'PU', 5, 'Uncommon', 'Solid: pushes you without contact damage. Deals 3 damage when it pushes you against a wall. Falls 20% slower than Wild base speed. Shields and hit protection block crush damage.'),
    ('weak', 'Weak block', '#c1cbd3', '·', 15, 'Common', 'Harmless: crumbles on contact. Practice slipping through.'),
    ('fire', 'Fire block', '#ff8a42', 'F', 8, 'Uncommon', '1 damage, then burns for 1 damage after 2 and 4 seconds.'),
    ('poison', 'Poison block', '#b2e85b', 'P', 7, 'Uncommon', '1 damage, then poison deals 1 damage every 3 seconds for 9 seconds.'),
    ('black_hole', 'Black hole', '#a882ff', 'BH', 3, 'Rare', 'Pulls you within its 130-unit ring. Contact deals 1 damage.'),
    ('block_attractor', 'Block Attractor', '#c89cff', 'IN', 3, 'Rare', 'Pulls nearby blocks within a 220-unit ring, larger than the black hole. Does not pull you. Contact deals 1 damage.'),
    ('block_repulsor', 'Block Repulsor', '#65e6c7', 'OUT', 3, 'Rare', 'Pushes nearby blocks away within a 220-unit ring. Does not push you. Contact deals 1 damage.'),
    ('chaos_nexus', 'Chaos Nexus', '#ffd079', 'NX', .9, 'Very rare', 'Very slow, with a huge 480-unit field. Every second switches between PULL YOU, PUSH YOU, PULL BLOCKS and PUSH BLOCKS. Each four-second cycle shuffles all four, using each once. More common than Instant-kill. Contact deals 1 damage.'),
    ('doom', 'Instant-kill block', '#ff3866', 'X', .45, 'Very rare', 'Contact ends the run, even through a shield or hit protection. Keep clear!'),
    ('long', 'Long block', '#e3c576', 'L', 9, 'Common', 'A six-tile beam, horizontal or vertical. 1 damage.'),
    ('frost', 'Frost block', '#a7eaff', 'I', 7, 'Uncommon', '1 damage and half movement speed for 2.5 seconds.'),
    ('heal', 'Heart block', '#6fed9b', '+', 4, 'Rare', 'A helpful pickup: restores 2 HP, up to 8.'),
    ('shield', 'Shield block', '#78a7ff', 'S', 3, 'Rare', 'A helpful pickup: absorbs one damaging contact. Does not block status damage or instant-kill blocks.'),
    ('haste', 'Haste block', '#fff281', '>>', 4, 'Rare', 'Deals 1 damage and boosts movement by 45% for 4 seconds. Shields and hit protection prevent the damage.'),
    ('heavy', 'Heavy block', '#c09275', '2', 6, 'Uncommon', 'Large, slower chunk. Contact deals 2 damage.'),
    ('seeker', 'Seeker block', '#ff98cb', 'T', 5, 'Uncommon', 'Steers sideways toward you as it falls. 1 damage.'),
    ('splitter', 'Splitter block', '#e8a8ff', 'Y', 5, 'Uncommon', 'Splits into three small shards after 1.4 seconds. Each deals 1 damage.'),
    ('bomb', 'Bomb block', '#ffbd5d', '!', 4, 'Rare', 'Shows a 65-unit warning ring, then explodes after 2 seconds. Blast or contact deals 2 damage.'),
    ('repulsor', 'Repulsor block', '#6cf2dd', 'R', 4, 'Rare', 'Pushes you away within its 120-unit ring. Contact deals 1 damage.'),
    ('ghost', 'Ghost block', '#d1c4f5', 'G', 6, 'Uncommon', 'Solid for 2 seconds, then outlined and harmless for 1 second. Repeats.'),
    ('spring', 'Spring block', '#8fe668', '^', 5, 'Uncommon', 'Bounces upward once at the floor, then falls again. 1 damage.'),
    ('antidote', 'Antidote block', '#91f6d1', 'A', 3, 'Rare', 'A helpful pickup: clears burning and poison, and restores 1 HP.'),
    ('thorn', 'Thorn block', '#e8ad72', 'TH', 5, 'Uncommon', '1 damage and resets the next healing tick to 8 seconds away. A shield blocks both effects.'),
    ('sonic', 'Sonic Speed block', '#70ceff', 'SS', 3, 'Rare', 'Falls at 1.5x Impossible base speed at the same elapsed time. 1 damage; does not change your movement. Speed effects multiply its base speed.'),
    ('snail', 'Snail block', '#cab18c', 'SN', 6, 'Uncommon', 'Falls at one third of Easy speed at the same elapsed time. 1 damage; does not slow you. Speed effects multiply its base speed.'),
    ('curse', 'Curse block', '#d67ef0', 'C', 4, 'Rare', 'No contact damage, but makes all falling blocks 40% faster for 4 seconds. Multiplies with Hourglass; repeats refresh the timer.'),
    ('glitch', 'Glitch block', '#8be7ce', 'G!', 4, 'Rare', 'Teleports 3 times to nearby locations. Each 1.2-second warning starts only in the bottom quarter of the arena; if it lands higher, it falls back down before warning again. 1 contact damage; persists through contact.'),
    ('elite_glitch', 'Elite Glitch block', '#ff5479', 'EG!', .8, 'Very rare', 'Red and blue. After 1 second fully on screen, teleports 3 times, each with a 1-second warning. Locks onto your position at the start of each warning, teleports to that marked spot, then falls normally after the third teleport. 1 contact damage; persists through contact.'),
    ('hourglass', 'Hourglass block', '#e8c7ff', 'HG', 3, 'Rare', 'A safe pickup: slows all falling blocks by 40% for 4 seconds.'),
    ('bubble', 'Bubble block', '#b6efff', 'B', 4, 'Rare', 'A safe pickup: grants 2 seconds of contact protection. Instant-kill blocks and status damage still hurt.'),
    ('ricochet', 'Ricochet block', '#ffb2b0', 'RC', 5, 'Uncommon', 'Bounces between the side walls as it falls. 1 damage.'),
    ('pendulum', 'Pendulum block', '#d9a2ff', 'PD', 5, 'Uncommon', 'Sweeps widely from side to side. 1 damage.'),
    ('meteor', 'Meteor block', '#ed9873', 'M', 3, 'Rare', 'A large, fast rock that deals 3 damage. Still obeys the Chaos speed limit.'),
    ('shatter', 'Shield Shatter block', '#f28cb8', 'SH', 3, 'Rare', 'Breaks your shield and deals 1 damage. Hit protection still prevents the damage.'),
    ('heartburst', 'Heartburst block', '#ffb9d6', 'HB', 2, 'Rare', 'A safe pickup: restores 3 HP, up to 8.'),
    ('zigzag', 'Zigzag block', '#f7abff', 'ZZ', 5, 'Uncommon', 'Changes sideways direction every half second as it falls. 1 damage.'),
    ('feather', 'Feather block', '#e7f4c1', 'FE', 6, 'Uncommon', 'Drifts in a wide sway at half of Easy falling speed. 1 damage. Falling-speed effects still stack.'),
    ('boulder', 'Boulder block', '#bb9b82', 'BO', 3, 'Rare', 'An enormous single tile, falling slowly but dealing 3 damage.'),
    ('phase', 'Phase block', '#bdc5ff', 'PH', 4, 'Rare', 'Solid and dangerous for 1 second, then outlined and harmless for 2 seconds. Repeats. 1 damage when solid.'),
    ('surge', 'Surge block', '#ffce67', 'SU', 4, 'Rare', 'Pulses between slow and fast falling speed every 2 seconds. 1 damage.'),
    ('rewind', 'Rewind block', '#f69fb9', 'RW', 4, 'Rare', 'After falling for 1.2 seconds, rises for 0.8 seconds once, then falls again. 1 damage.'),
    ('mender', 'Mender block', '#9fffc2', 'ME', 2, 'Rare', 'A safe pickup: heals 1 HP and clears burning, poison, Frost, Curse and Vertigo.'),
    ('stasis', 'Stasis block', '#86e0ff', 'ST', 2, 'Rare', 'A safe pickup: stops vertical falling and rising for 1.5 seconds. Sideways movement, fields and teleports continue. Repeats refresh the timer.'),
    ('venom_fang', 'Venom Fang block', '#d4f078', 'VF', 3, 'Rare', '2 contact damage, then poisons you for 1 damage after 3 and 6 seconds. A shield blocks both the bite and poison.'),
    ('phoenix', 'Phoenix block', '#ffac87', 'PX', .8, 'Very rare', 'A safe pickup: restores 4 HP and extinguishes burning. Does not revive a finished run.'),
    ('aegis', 'Aegis block', '#9dbbff', 'AE', 1.5, 'Rare', 'A safe pickup: grants a shield and 1.5 seconds of contact protection. Instant-kill and status damage still bypass protection.'),
    ('mint', 'Mint block', '#98ffde', 'MI', 3, 'Rare', 'A safe pickup: clears Frost and grants 2 seconds of Haste without dealing damage.'),
    ('clockwork', 'Clockwork block', '#ffe49c', 'CW', 3, 'Rare', 'A safe pickup: brings your next natural healing tick to at most 1 second away.'),
    ('repellent', 'Repellent block', '#b6b5ff', 'RP', 2, 'Rare', 'A safe pickup: makes you immune to pulling and pushing fields for 4 seconds. Blocks still move and contact still hurts.'),
    ('lullaby', 'Lullaby block', '#c6caff', 'LU', 2, 'Rare', 'A safe pickup: delays the next new block until at least 3 seconds away. Existing blocks keep moving.'),
    ('tar', 'Tar block', '#ac95ba', 'TA', 4, 'Rare', '1 damage and 4 seconds of Frost, halving your movement speed. A shield prevents both.'),
    ('ember', 'Ember block', '#ffb25f', 'EM', 3, 'Rare', '2 contact damage, then burns for 1 extra damage after 2 seconds. A shield prevents both.'),
    ('rust', 'Rust block', '#d99768', 'RU', 3, 'Rare', '1 damage and removes Haste, Hourglass and Stasis effects. A shield prevents the damage and removal.'),
    ('drain', 'Drain block', '#d087b6', 'DR', 3, 'Rare', '1 damage and delays your next natural healing tick to 12 seconds away. A shield prevents both.'),
    ('frostbite', 'Frostbite block', '#c1eaff', 'FB', 3, 'Rare', '2 damage and 1.5 seconds of Frost, halving your movement speed. A shield prevents both.'),
    ('crossfire', 'Crossfire block', '#f5a2c6', 'CF', 1.5, 'Rare', '2 damage, then burns for 1 after 2 seconds and poisons for 1 after 3 seconds. A shield prevents all three.'),
    ('drill', 'Drill block', '#d1b8ee', 'DI', 4, 'Rare', 'A narrow four-tile vertical drill that falls quickly and straight. 2 damage.'),
    ('ribbon', 'Ribbon block', '#f4a8db', 'RI', 4, 'Rare', 'A five-tile horizontal ribbon that waves rapidly from side to side. 1 damage.'),
    ('corkscrew', 'Corkscrew block', '#92e8d3', 'CS', 4, 'Rare', 'Loops sideways while alternating between rising and falling every half second, drifting downward overall. 1 damage.'),
    ('parachute', 'Parachute block', '#dceca1', 'PA', 5, 'Uncommon', 'Falls quickly for 0.6 seconds, then opens its chute and falls at one quarter of Easy speed. 1 damage.'),
    ('rocket', 'Rocket block', '#ff9c92', 'RO', 3, 'Rare', 'Falls slowly for 1 second, then accelerates to the Chaos base speed limit. 2 damage. Falling-speed effects still stack.'),
    ('skater', 'Skater block', '#9bd1f4', 'SK', 5, 'Uncommon', 'Steers sideways away from you at up to 100 units per second as it falls. 1 damage.'),
    ('fire_x', 'Fire X block', '#ff9367', 'FX', 2, 'Rare', 'Settles at the arena center, beeps and marks an X for 1.5 seconds, then fires diagonal flame lines to the edges for 0.65 seconds. Flames deal 3 damage and 1 burn damage after 2 seconds. Body contact deals 1 damage.'),
    ('fire_plus', 'Fire Plus block', '#ffb56c', 'F+', 2, 'Rare', 'Settles at the arena center, beeps and marks a + for 1.5 seconds, then fires horizontal and vertical flame lines to the edges for 0.65 seconds. Flames deal 3 damage and 1 burn damage after 2 seconds. Body contact deals 1 damage.'),
    ('fire_star', 'Fire Star block', '#ff7899', 'F*', 1, 'Rare', 'Settles at the arena center, beeps and marks both X and + for 1.5 seconds, then fires all eight flame lines together for 0.65 seconds. Flames deal 3 damage and 1 burn damage after 2 seconds. Body contact deals 1 damage.'),
    ('vortex', 'Vortex block', '#b3a0ff', 'VX', 2.5, 'Rare', 'Swirls you and nearby blocks inward around a 200-unit field. Repellent protects you from the swirl. 1 contact damage.'),
    ('pinball', 'Pinball block', '#f6d37d', 'PB', 4, 'Rare', 'Ricochets off the side walls and bounces upward from the floor 3 times before falling out. 1 damage.'),
    ('iceburst', 'Iceburst block', '#9fe8ff', 'IB', 3, 'Rare', 'Splits into 3 small Frost shards after 1.4 seconds. Each shard deals 1 damage and slows you for 2.5 seconds. The unsplit block deals 1 damage.'),
    ('firecracker', 'Firecracker block', '#ff9f76', 'FC', 3, 'Rare', 'Splits into 3 small Fire shards after 1.4 seconds. Each shard deals 1 damage, then burns for 1 after 2 and 4 seconds. The unsplit block deals 1 damage.'),
    ('sanctuary', 'Sanctuary block', '#a2ffcb', 'SA', 1, 'Rare', 'A safe pickup: heals 2 HP, grants a shield, clears burning, poison, Frost, Curse and Vertigo, and resets delayed natural healing to at most 8 seconds away.'),
    ('vertigo', 'Vertigo block', '#e4a2f1', 'VT', 3, 'Rare', '1 damage and reverses your movement controls for 3 seconds. A shield prevents both. Mender and Sanctuary clear the reversal.'),
    ('comet', 'Comet block', '#81b6ff', '*', 6, 'Uncommon', 'Accelerates as it falls, up to the Chaos speed limit. 1 damage.'),
)
# Additional blocks share explicit behavior tables with their guide metadata.
EXPANSION_TYPES = (
    ('bandage', 'Bandage', '#f4d8bc', 'BD', 2, 'Rare', 'Harmless pickup: Restores 1 HP. A small, fast-falling pickup.'),
    ('medkit', 'Medkit', '#f09fa9', 'MK', 2, 'Rare', 'Harmless pickup: Restores 2 HP and clears Frost.'),
    ('detox', 'Detox', '#b0e99b', 'DX', 2, 'Rare', 'Harmless pickup: Clears poison and restores 0.5 HP.'),
    ('coolant', 'Coolant', '#91dcea', 'CO', 2, 'Rare', 'Harmless pickup: Extinguishes burning and slows falling blocks by 40% for 2 seconds.'),
    ('compass', 'Compass', '#e5ce9a', 'CP', 2, 'Rare', 'Harmless pickup: Clears reversed controls and grants 2 seconds of field immunity.'),
    ('battery', 'Battery', '#d8ed7e', 'BT', 2, 'Rare', 'Harmless pickup: Grants a shield and 3 seconds of Haste.'),
    ('snowglobe', 'Snowglobe', '#a9ceff', 'SG', 2, 'Rare', 'Harmless pickup: Stops vertical block movement for 0.75 seconds and slows falling blocks for 3 seconds.'),
    ('sweeper', 'Sweeper', '#81e5c9', 'SW', 2, 'Rare', 'Harmless pickup: Clears all pellets within 180 units and restores 1 HP.'),
    ('oasis', 'Oasis', '#8ce2b0', 'OA', 2, 'Rare', 'Harmless pickup: Restores 1 HP and delays the next spawn until at least 2 seconds away.'),
    ('clean_slate', 'Clean Slate', '#dbe9f4', 'CL', 2, 'Rare', 'Harmless pickup: Clears burning, poison, Frost, Curse and reversed controls; grants 0.75 seconds of contact protection.'),
    ('cinder', 'Cinder', '#e98b68', 'CI', 2, 'Rare', '.5 contact damage, then burns for 1 damage after 2, 4 and 6 seconds.'),
    ('spore', 'Spore', '#b6c979', 'SO', 2, 'Rare', '.5 contact damage, then poison deals 1 damage every 3 seconds for 12 seconds.'),
    ('sleet', 'Sleet', '#9bbdeb', 'SL', 2, 'Rare', '1 damage, 3 seconds of Frost, and 2 seconds of Curse, making falling blocks 40% faster.'),
    ('dizzy', 'Dizzy', '#cfa4e9', 'DZ', 2, 'Rare', '.5 damage and reversed controls for 5 seconds.'),
    ('leech', 'Leech', '#ae7d9d', 'LE', 2, 'Rare', '2 damage and delays the next natural heal to 16 seconds away.'),
    ('overload', 'Overload', '#efca73', 'OV', 2, 'Rare', '1 damage, 2 seconds of Haste, and 3 seconds of Curse.'),
    ('nullifier', 'Nullifier', '#a0a2bd', 'NU', 2, 'Rare', 'Removes your shield, Haste, Hourglass and Stasis, then deals 1 damage. Hit protection still blocks the damage.'),
    ('glass', 'Glass', '#b4e5ed', 'GL', 1.5, 'Rare', 'A small, slow but dangerous crystal: 4 damage on contact.'),
    ('dart', 'Dart', '#e5b17e', 'DA', 2, 'Rare', 'A tiny straight-falling dart at 2.8x Chaos base speed. .5 damage.'),
    ('anvil', 'Anvil', '#9b9da8', 'AN', 2, 'Rare', 'A large weight: 0.4x base falling speed for 1.2 seconds, then 2.4x. 2 damage.'),
    ('lantern', 'Lantern', '#edcf86', 'LA', 2, 'Rare', 'A slow glowing lantern at 0.3x base falling speed, swaying gently. 1 damage.'),
    ('sawtooth', 'Sawtooth', '#d9a195', 'SAW', 2, 'Rare', 'Reverses horizontal direction every 0.25 seconds at 180 units per second. 1 damage.'),
    ('waltz', 'Waltz', '#bc9be6', 'WA', 2, 'Rare', 'Sweeps 95 units sideways with a slow one-radian-per-second sway, falling at 0.7x base speed. 1 damage.'),
    ('boomerang', 'Boomerang', '#dfb88a', 'BM', 2, 'Rare', 'After 1 second, rises for 1.2 seconds once before falling again. 1 damage.'),
    ('blink', 'Blink', '#a8b7e8', 'BK', 2, 'Rare', 'Solid for 0.4 seconds, then harmless for 0.8 seconds. Repeats. 1 damage when solid.'),
    ('hopper', 'Hopper', '#a4d98b', 'HP', 2, 'Rare', 'Bounces upward twice at the floor before falling out. 1 damage.'),
    ('crossbow', 'Crossbow', '#d5ad83', 'CB', 2, 'Rare', 'Four fixed cardinal cannons fire .5-damage pellets every 1.2 seconds. 1 body contact damage.'),
    ('diagonal', 'Diagonal Turret', '#c1a2d4', 'DT', 2, 'Rare', 'Four diagonal cannons fire .5-damage pellets every 1.5 seconds. 1 body contact damage.'),
    ('spinner', 'Spinner', '#d5a2b8', 'SPN', 2, 'Rare', 'One cannon rotates once every 4 seconds, firing a .5-damage pellet every 0.5 seconds. 1 body contact damage.'),
    ('scatter', 'Scatter Cannon', '#e8ba7d', 'SC', 2, 'Rare', 'Three cannons spread 45 degrees apart, choosing a new direction for each .5-damage volley every 0.9 seconds. 1 body contact damage.'),
)
BLOCK_TYPES += EXPANSION_TYPES
PICKUP_EFFECTS = {
    'second_wind': {'regeneration': 4},
    'storm_shelter': {'timers': {'invulnerable': 3, 'repellent_left': 3}},
    'bandage': {'heal': 1},
    'medkit': {'heal': 2, 'clear': ('frost_left',)},
    'detox': {'heal': 0.5, 'clear': ('poison_ticks', 'poison_in')},
    'coolant': {'clear': ('burn_ticks', 'burn_in'), 'timers': {'slowfall_left': 2}},
    'compass': {'clear': ('vertigo_left',), 'timers': {'repellent_left': 2}},
    'battery': {'shield': True, 'timers': {'haste_left': 3}},
    'snowglobe': {'timers': {'stasis_left': 0.75, 'slowfall_left': 3}},
    'sweeper': {'heal': 1, 'clear_pellets': 180},
    'oasis': {'heal': 1, 'delay': 2},
    'clean_slate': {'clear': ('burn_ticks', 'burn_in', 'poison_ticks', 'poison_in', 'frost_left', 'curse_left', 'vertigo_left'), 'timers': {'invulnerable': 0.75}},
}
CONTACT_EFFECTS = {
    'backdraft': {'damage': 1, 'burn': 2, 'timers': {'curse_left': 3}},
    'cinder': {'damage': 0.5, 'burn': 3},
    'spore': {'damage': 0.5, 'poison': 4},
    'sleet': {'damage': 1, 'timers': {'frost_left': 3, 'curse_left': 2}},
    'dizzy': {'damage': 0.5, 'timers': {'vertigo_left': 5}},
    'leech': {'damage': 2, 'regen': 16},
    'overload': {'damage': 1, 'timers': {'haste_left': 2, 'curse_left': 3}},
    'nullifier': {'damage': 1, 'strip': True},
    'glass': {'damage': 4},
}
MOTION_BLOCKS = {
    'dart': {'size': 18, 'speed': 2.8, 'sway': 0, 'damage': 0.5},
    'anvil': {'size': 52, 'speed': 0.4, 'sway': 0, 'damage': 2},
    'lantern': {'size': 30, 'speed': 0.3, 'sway': 18, 'damage': 1},
    'sawtooth': {'size': 28, 'speed': 1, 'sway': 0, 'damage': 1},
    'waltz': {'size': 32, 'speed': 0.7, 'sway': 95, 'damage': 1},
    'boomerang': {'size': 28, 'speed': 1, 'sway': 25, 'damage': 1},
    'blink': {'size': 30, 'speed': 0.8, 'sway': 0, 'damage': 1},
    'hopper': {'size': 28, 'speed': 1.2, 'sway': 0, 'damage': 1},
}
TURRET_BLOCKS = {
    'crossbow': {'angles': (0, 2, 4, 6), 'interval': 1.2, 'spin': 0},
    'diagonal': {'angles': (1, 3, 5, 7), 'interval': 1.5, 'spin': 0},
    'spinner': {'angles': (0,), 'interval': 0.5, 'spin': 1.5707963267948966},
    'scatter': {'angles': (7, 0, 1), 'interval': 0.9, 'spin': 0},
}

def allocate_spawn_tickets(rows):
    """Apportion 1,000 equal tickets, preserving the two fixed spawn rates."""
    fixed = {'wild_seven': 8, 'blaster': 50}
    weights = {row[0]: Fraction(str(row[4])) for row in rows if row[0] not in fixed}
    available = 1000-sum(fixed.values())
    total = sum(weights.values())
    quotas = {kind: weight*available/total for kind, weight in weights.items()}
    tickets = {kind: max(1, quota.numerator//quota.denominator) for kind, quota in quotas.items()}
    left = available-sum(tickets.values())
    if left < 0:
        raise ValueError('Too many block types to give each a positive tenth-percent chance.')
    # Largest remainders keep the existing balance as close as possible.
    order = sorted(weights, key=lambda kind: quotas[kind]-tickets[kind], reverse=True)
    for kind in order[:left]: tickets[kind] += 1
    return dict(tickets, **fixed)


_spawn_tickets = allocate_spawn_tickets(BLOCK_TYPES)
BLOCK_TYPES = tuple(row[:4]+(_spawn_tickets[row[0]],)+row[5:] for row in BLOCK_TYPES)
# Overall encounter classification: damaging blocks remain harmful even when
# they also grant a buff; mixed field effects and unknown reveals are neutral.
HELPFUL_BLOCKS = frozenset(PICKUP_EFFECTS) | frozenset({
    'amber', 'ricochet_shield', 'turbo', 'heal', 'shield', 'antidote',
    'hourglass', 'bubble', 'heartburst', 'mender', 'stasis', 'phoenix',
    'aegis', 'mint', 'clockwork', 'repellent', 'lullaby', 'sanctuary',
})
NEUTRAL_BLOCKS = frozenset({'weak', 'mystery', 'elite_leafy', 'elite_turbo'})
CATALOG = {row[0]: dict(zip(('id', 'name', 'color', 'symbol', 'weight', 'rarity', 'description'), row)) for row in BLOCK_TYPES}
for _kind, _metadata in CATALOG.items():
    _metadata['disposition'] = ('helpful' if _kind in HELPFUL_BLOCKS else
                                'neutral' if _kind in NEUTRAL_BLOCKS else 'harmful')

ARENA_PICKUPS = {
    'target_lock': {'target_lock_left': 6},
    'danger_edge': {'danger_edge_left': 6},
    'arena_shrink': {'arena_shrink_left': 3},
    'project_mayhem': {'arena_shrink_left': 3, 'danger_edge_left': 3},
    'project_chaos': {'arena_shrink_left': 3, 'danger_edge_left': 3, 'target_lock_left': 3},
}
SAFE_BLOCKS = frozenset(('amber', 'ricochet_shield', 'sanctuary', 'weak', 'heal', 'shield', 'antidote', 'bubble', 'hourglass', 'heartburst', 'curse', 'mender', 'stasis', 'phoenix', 'aegis', 'mint', 'clockwork', 'repellent', 'lullaby'))
SAFE_BLOCKS = SAFE_BLOCKS | frozenset(PICKUP_EFFECTS) | frozenset(ARENA_PICKUPS)
COLLECTIBLE_BLOCKS = (SAFE_BLOCKS - {'weak'}) | {'coin_flip', 'all_or_nothing'}
for _kind, _metadata in CATALOG.items():
    _metadata['collectible'] = _kind in COLLECTIBLE_BLOCKS

FIRE_PATTERNS = {'fire_x': ((1, 1), (-1, 1), (1, -1), (-1, -1)),
                 'fire_plus': ((1, 0), (-1, 0), (0, 1), (0, -1))}
FIRE_PATTERNS['fire_star'] = FIRE_PATTERNS['fire_x'] + FIRE_PATTERNS['fire_plus']

PASS_THROUGH_SPEEDS = {'leafy': .5, 'turbo': 1.5, 'elite_leafy': .5, 'elite_turbo': 1.5}

AURA_EFFECTS = {'steaming': 'poison', 'electric': 'haste', 'stinky': 'poison', 'chilly': 'frost'}
AURA_RADIUS = 60

PUSH_PULL_STRENGTH = 1.5

FIELD_MODES = ('pull_player', 'push_player', 'pull_blocks', 'push_blocks')
FIELD_LABELS = dict(zip(FIELD_MODES, ('PULL YOU', 'PUSH YOU', 'PULL BLOCKS', 'PUSH BLOCKS')))
FIELD_RADII = {'vortex': 200, 'gravity_well': 300, 'force_wave': 300, 'black_hole': 130, 'repulsor': 120, 'block_attractor': 220, 'block_repulsor': 220, 'chaos_nexus': 480}


def elite_fill_color(block):
    if block.kind not in ('elite_leafy', 'elite_turbo'):
        return block.color
    colors = ('#61c9b5', '#779ed5', '#b58bc9', '#cf9894', '#c6b76d', '#8cbb79')
    return colors[int((block.age+1e-9)*10) % len(colors)]


def block_is_solid(block):
    if block.kind == 'thunder' or block.kind in PASS_THROUGH_SPEEDS: return False
    if block.kind == 'blink': return (block.age+1e-9) % 1.2 < .4
    if block.kind == 'ghost': return block.age % 3 < 2
    if block.kind == 'phase': return block.age % 3 < 1
    return True


def field_mode(block):
    if block.kind == 'chaos_nexus':
        return block.field_order[int((block.age+1e-9) % 4)] if block.field_order else 'pull_player'
    return {'vortex': 'orbit_all', 'gravity_well': 'pull_all', 'force_wave': 'push_all', 'black_hole': 'pull_player', 'repulsor': 'push_player',
            'block_attractor': 'pull_blocks', 'block_repulsor': 'push_blocks'}.get(block.kind)


NEW_SHAPES = (
    ((0, 0),), ((0, 0), (1, 0)),
    ((1, 0), (0, 1), (1, 1), (2, 1), (1, 2)),  # cross
    ((0, 0), (0, 1), (0, 2), (1, 0), (2, 0)),  # corner
    ((0, 0), (0, 1), (1, 1), (2, 1), (2, 0)),  # arch
    ((0, 0), (1, 1), (2, 2)),  # diagonal
    ((0, 0), (1, 0), (2, 0), (1, 1), (1, 2)),  # tall T
)


def exact_spawn_percentages():
    total = sum(item['weight'] for item in CATALOG.values())
    return {kind: Fraction(item['weight']*100, total) for kind, item in CATALOG.items()}


def catalog():
    total = sum(item['weight'] for item in CATALOG.values())
    # Sample real spawn geometry so the guide cannot drift from gameplay.
    import random
    from dodge_model import DodgeGame
    game = DodgeGame(random.Random(42), 'chaos')
    result = []
    for kind, item in CATALOG.items():
        game.blocks = []
        game.spawn_chaos(kind)
        block = game.blocks[0]
        result.append(dict(item, chance=item['weight'] / 10,
                           solidity=('Solid / not solid (alternates)' if kind in ('blink', 'ghost', 'phase')
                                     else 'Solid' if block_is_solid(block) else 'Not solid'),
                           preview_cells=block.cells, preview_size=block.cell_size, preview_color=block.color,
                           preview_speed=game.chaos_fall_speed(block), preview_cannons=block.cannons,
                           preview_rotation_speed=block.rotation_speed,
                           preview_shot_interval=TURRET_BLOCKS.get(kind, {}).get('interval'),
                           helpful=kind in SAFE_BLOCKS and kind not in ARENA_PICKUPS and kind not in ('weak', 'curse')))
    new_kinds = ('second_wind', 'backdraft', 'storm_shelter', 'coin_flip', 'all_or_nothing')
    new_blocks = {item['id']: item for item in result if item['id'] in new_kinds}
    result = [item for item in result if item['id'] not in new_kinds]
    after_horizontal = next(i for i, item in enumerate(result) if item['id'] == 'horizontal') + 1
    result[after_horizontal:after_horizontal] = [new_blocks[kind] for kind in new_kinds]
    return result


class ChaosRules:
    def setup_chaos(self):
        self.lives = self.max_lives = 8
        self.invulnerable = self.damage_taken = self.healing_collected = 0
        self.protection_left = 0
        self.regen_in = 8.0
        self.regeneration_left = 0.0
        self.regeneration_in = 1.0
        self.burn_ticks = self.poison_ticks = 0
        self.burn_in = self.poison_in = 0.0
        self.frost_left = self.haste_left = 0.0
        self.curse_left = self.slowfall_left = self.stasis_left = 0.0
        self.repellent_left = self.vertigo_left = 0.0
        self.target_lock_left = self.danger_edge_left = self.arena_shrink_left = 0
        self.chaos_sound_events = []
        self.pellets = []
        self.pellet_freeze_left = 0
        self.shield = False
        self.spawn_in = 1.6

    @property
    def pattern_label(self):
        if self.difficulty != 'chaos':
            return 'Dodge the blocks. Stay in the game.'
        effects = []
        if self.burn_ticks: effects.append('BURNING')
        if self.poison_ticks: effects.append('POISONED')
        if self.frost_left: effects.append('SLOWED')
        if self.haste_left: effects.append('HASTE')
        if self.curse_left: effects.append('CURSED: FAST FALL')
        if self.slowfall_left: effects.append('SLOW FALL')
        if self.stasis_left: effects.append('STASIS')
        if self.vertigo_left: effects.append('REVERSED CONTROLS')
        if self.repellent_left: effects.append('FIELD IMMUNITY')
        if self.target_lock_left: effects.append(f'TARGET LOCK {math.ceil(self.target_lock_left)}s')
        if self.danger_edge_left: effects.append(f'LETHAL EDGES {math.ceil(self.danger_edge_left)}s')
        if self.arena_shrink_left: effects.append(f'SHRUNK ARENA {math.ceil(self.arena_shrink_left)}s')
        if self.pellet_freeze_left: effects.append(f'FROZEN PELLETS {math.ceil(self.pellet_freeze_left)}s')
        if self.regeneration_left: effects.append('REGENERATION')
        if self.shield: effects.append('SHIELDED')
        return f"Chaos · Heal +1 in {math.ceil(self.regen_in)}s · " + (' / '.join(effects) or 'Collect hearts, shields and antidotes; lightning hurts')

    def spawn_chaos(self, kind=None):
        if len(self.blocks) >= 80:
            return
        if kind is None:
            ticket = self.rng.randrange(sum(item['weight'] for item in CATALOG.values()))
            for candidate, item in CATALOG.items():
                ticket -= item['weight']
                if ticket < 0:
                    kind = candidate
                    break
        self.blocks.append(self.make_chaos_block(kind))

    def make_chaos_block(self, kind):
        from dodge_model import Block, CELL, SHAPES, COLORS
        info = CATALOG[kind]
        cells = tuple((i, 0) for i in range(6)) if kind == 'long' else self.rng.choice(SHAPES + NEW_SHAPES)
        if kind in ARENA_PICKUPS or kind in PICKUP_EFFECTS or kind in CONTACT_EFFECTS or kind in MOTION_BLOCKS or kind in TURRET_BLOCKS or kind in AURA_EFFECTS or kind in ('coin_flip', 'all_or_nothing', 'amber', 'ricochet_shield', 'blaster', 'fan', 'giga_fan', 'spike', 'thunder', 'mystery', 'pusher', 'vortex', 'pinball', 'sanctuary', 'vertigo', 'fire_x', 'fire_plus', 'fire_star', 'gravity_well', 'force_wave', 'phoenix', 'aegis', 'mint', 'clockwork', 'repellent', 'lullaby', 'rocket', 'parachute', 'corkscrew', 'boulder', 'mender', 'stasis', 'venom_fang', 'block_attractor', 'block_repulsor', 'chaos_nexus', 'black_hole', 'repulsor', 'heal', 'shield', 'haste', 'bomb', 'doom', 'antidote', 'sonic', 'snail', 'hourglass', 'bubble', 'heartburst', 'shatter', 'curse', 'glitch', 'elite_glitch'):
            cells = ((0, 0),)
        for _ in range(self.rng.randrange(4)):
            cells = tuple((-y, x) for x, y in cells)
        min_x, min_y = min(x for x, y in cells), min(y for x, y in cells)
        cells = tuple((x-min_x, y-min_y) for x, y in cells)
        if kind == 'drill': cells = tuple((0, i) for i in range(4))
        if kind == 'ribbon': cells = tuple((i, 0) for i in range(5))
        cell = CELL * self.rng.uniform(.55, 1.4)
        speed = self.rng.uniform(.85, 4.45)
        if kind == 'anti_gravity': speed = 1
        if kind == 'horizontal': speed = .5
        if kind in ('sonic', 'snail'): speed = 1
        if kind in ('glitch', 'elite_glitch'): speed = .8
        if kind in FIRE_PATTERNS: cell, speed = 32, 1
        if kind in AURA_EFFECTS: cell, speed = 32, 1
        if kind == 'mystery': cell, speed = 32, 1
        if kind in ('pusher', 'spike'): cell, speed = 38, .8
        if kind in ('amber', 'ricochet_shield', 'thunder', 'fan', 'giga_fan', 'blaster') or kind in PASS_THROUGH_SPEEDS: cell, speed = 32, 1
        if kind in PICKUP_EFFECTS or kind in CONTACT_EFFECTS or kind in TURRET_BLOCKS: cell, speed = 28, .9
        if kind == 'bandage': cell, speed = 22, 1.4
        if kind == 'glass': cell, speed = 20, .6
        if kind in MOTION_BLOCKS: cell, speed = MOTION_BLOCKS[kind]['size'], MOTION_BLOCKS[kind]['speed']
        if kind == 'chaos_nexus': cell = 38
        if kind == 'drill': cell, speed = 18, 3.4
        if kind == 'ribbon': cell, speed = 20, .8
        if kind == 'corkscrew': speed = .7
        if kind == 'boulder': cell, speed = 64, .6
        if kind == 'surge': speed = 1
        if kind == 'rewind': speed = .8
        if kind == 'meteor': cell, speed = CELL * 1.4, 4.45
        if kind == 'heavy': cell, speed = CELL * 1.5, self.rng.uniform(.85, 1.3)
        if kind in ('doom', 'bomb'): speed = min(speed, 1.7)  # Rare lethal hazards remain readable.
        width = max(x for x, y in cells) * cell
        block = Block(self.rng.uniform(self.left+cell/2, self.right-cell/2-width), self.top+cell,
                      cells, self.rng.choice(COLORS) if kind in ('normal', 'wild_seven') else info['color'], speed, self.rng.uniform(0, math.tau),
                      self.rng.uniform(0, 80), cell_size=cell, kind=kind)
        if kind in ('ricochet', 'pinball'):
            block.velocity_x = self.rng.choice((-140, 140))
            block.sway_amplitude = 0
        if kind == 'zigzag':
            block.velocity_x = self.rng.choice((-130, 130))
            block.sway_amplitude = 0
        if kind in ('drill', 'rocket', 'skater'): block.sway_amplitude = 0
        if kind == 'ribbon': block.sway_amplitude = 55
        if kind == 'corkscrew': block.sway_amplitude = 45
        if kind == 'feather': block.sway_amplitude = 90
        if kind == 'pendulum': block.sway_amplitude = 110
        if kind in ('glitch', 'elite_glitch'): block.sway_amplitude = 0
        if kind == 'chaos_nexus':
            block.sway_amplitude = 0
            self.prepare_field(block)
        if kind in FIRE_PATTERNS:
            block.x = (self.left+self.right)/2
            block.sway_amplitude = 0
        if kind in ('mystery', 'thunder'): block.sway_amplitude = 0
        if kind == 'blaster':
            directions = list(range(8))
            self.rng.shuffle(directions)
            count = 1
            while count < 8 and self.rng.random() < .4:
                count += 1
            block.cannons = tuple(direction*math.pi/4 for direction in directions[:count])
            block.rotation_speed = self.rng.choice((-1, 1))*math.tau/12 if self.rng.random() < .3 else 0
            block.shot_in = self.rng.uniform(.3, .9)
            block.sway_amplitude = 0
        if kind in MOTION_BLOCKS: block.sway_amplitude = MOTION_BLOCKS[kind]['sway']
        if kind == 'sawtooth': block.velocity_x = self.rng.choice((-180, 180))
        if kind in TURRET_BLOCKS:
            config = TURRET_BLOCKS[kind]
            block.cannons = tuple(a*math.pi/4 for a in config['angles'])
            block.shot_in = config['interval']
            block.rotation_speed = config['spin']
            block.sway_amplitude = 0
        if kind == 'horizontal':
            block.velocity_x = self.rng.choice((-1, 1))
            block.sway_amplitude = 0
            height = max(y for x, y in cells)*cell
            block.x = self.left-cell-width if block.velocity_x > 0 else self.right+cell
            block.y = self.rng.uniform(self.bottom+cell/2, self.top-cell/2-height)
        if kind == 'anti_gravity':
            height = max(y for x, y in cells)*cell
            block.y = self.bottom-cell-height
        return block

    def reveal_mystery(self, block):
        if block.kind != 'mystery' or math.hypot(self.x-block.x, self.y-block.y) > 120:
            return False
        # Derive candidates at reveal time: new catalog entries need no extra list.
        kind = self.rng.choice(tuple(kind for kind in CATALOG if kind != 'mystery'))
        revealed = self.make_chaos_block(kind)
        width = max(x for x, y in revealed.cells)*revealed.cell_size
        height = max(y for x, y in revealed.cells)*revealed.cell_size
        revealed.x = max(self.left+revealed.cell_size/2,
                         min(self.right-revealed.cell_size/2-width, block.x-width/2))
        revealed.y = block.y-height/2
        # Keep the existing object and block count, but start the revealed type's
        # timers fresh so bombs, splitters and teleports retain their warnings.
        block.__dict__.update(revealed.__dict__)
        return True

    def chaos_damage(self, amount, cause, contact=True):
        if not self.alive or (contact and self.invulnerable > 0):
            return False
        if contact and self.shield:
            self.shield = False
            self.invulnerable = 1
            return False
        actual = min(self.lives, amount)
        self.lives -= actual
        self.damage_taken += actual
        if contact: self.invulnerable = 1
        if not self.lives:
            self.alive, self.death_cause = False, cause
        return True

    def grant_chaos_protection(self, duration):
        self.protection_left = max(self.protection_left, duration)
        self.invulnerable = max(self.invulnerable, duration)

    def overlap_statuses(self):
        from dodge_model import touches_block
        kinds = {b.kind for b in self.blocks if b.kind in PASS_THROUGH_SPEEDS and touches_block(self.x,self.y,b)}
        return bool(kinds & {'leafy','elite_leafy'}), bool(kinds & {'turbo','elite_turbo'})

    def chaos_heal(self, amount):
        healed = min(amount, self.max_lives-self.lives)
        self.lives += healed
        self.healing_collected += healed

    def chaos_contact(self, block):
        kind = block.kind
        if kind in ('coin_flip', 'all_or_nothing'):
            if self.rng.random() < .5:
                self.chaos_heal(2 if kind == 'coin_flip' else self.max_lives)
            else:
                self.chaos_damage(2 if kind == 'coin_flip' else self.lives,
                                  kind, contact=kind == 'coin_flip')
            return
        if kind == 'amber':
            self.pellet_freeze_left = 3
            return
        if kind in ARENA_PICKUPS:
            for attribute, duration in ARENA_PICKUPS[kind].items():
                setattr(self, attribute, max(getattr(self, attribute), duration))
            self.update_chaos_bounds()
            self.check_chaos_edges()
            return
        if kind in PICKUP_EFFECTS:
            effect = PICKUP_EFFECTS[kind]
            if effect.get('regeneration'):
                if not self.regeneration_left: self.regeneration_in = 1.0
                self.regeneration_left = max(self.regeneration_left, effect['regeneration'])
            self.chaos_heal(effect.get('heal', 0))
            for attribute in effect.get('clear', ()): setattr(self, attribute, 0)
            for attribute, duration in effect.get('timers', {}).items():
                if attribute == 'invulnerable': self.grant_chaos_protection(duration)
                else: setattr(self, attribute, max(getattr(self, attribute), duration))
            if effect.get('shield'): self.shield = True
            if effect.get('delay'): self.spawn_in = max(self.spawn_in, effect['delay'])
            if effect.get('clear_pellets'):
                self.pellets = [p for p in self.pellets if math.hypot(p.x-self.x,p.y-self.y) > effect['clear_pellets']]
            return
        if kind in CONTACT_EFFECTS:
            effect = CONTACT_EFFECTS[kind]
            if effect.get('strip'):
                self.shield = False
                self.haste_left = self.slowfall_left = self.stasis_left = 0
            if self.chaos_damage(effect['damage'], kind):
                for attribute, duration in effect.get('timers', {}).items():
                    setattr(self, attribute, max(getattr(self, attribute), duration))
                if effect.get('burn'): self.burn_ticks, self.burn_in = effect['burn'], 2
                if effect.get('poison'): self.poison_ticks, self.poison_in = effect['poison'], 3
                if effect.get('regen'): self.regen_in = effect['regen']
            return
        if kind in MOTION_BLOCKS:
            self.chaos_damage(MOTION_BLOCKS[kind]['damage'], kind)
            return
        if kind == 'ricochet_shield':
            self.shield = True
            for pellet in self.pellets:
                dx, dy = pellet.x-self.x, pellet.y-self.y
                distance = math.hypot(dx, dy)
                if distance > 140: continue
                if distance < 1e-9: dx, dy, distance = 0, 1, 1
                speed = math.hypot(pellet.velocity_x, pellet.velocity_y) or 240
                pellet.velocity_x, pellet.velocity_y = dx/distance*speed, dy/distance*speed
                pellet.color, pellet.kind = '#80f3d4', 'reflected_pellet'
            return
        if kind == 'sanctuary':
            self.chaos_heal(2)
            self.shield = True
            self.burn_ticks = self.poison_ticks = 0
            self.burn_in = self.poison_in = 0
            self.frost_left = self.curse_left = self.vertigo_left = 0
            self.regen_in = min(self.regen_in, 8)
            return
        if kind == 'phoenix':
            self.chaos_heal(4)
            self.burn_ticks = self.burn_in = 0
            return
        if kind == 'aegis':
            self.shield = True
            self.grant_chaos_protection(1.5)
            return
        if kind == 'mint':
            self.frost_left = 0
            self.haste_left = max(self.haste_left, 2)
            return
        if kind == 'clockwork': self.regen_in = min(self.regen_in, 1); return
        if kind == 'repellent': self.repellent_left = 4; return
        if kind == 'lullaby': self.spawn_in = max(self.spawn_in, 3); return
        if kind == 'stasis': self.stasis_left = 1.5; return
        if kind == 'mender':
            self.frost_left = self.curse_left = self.vertigo_left = 0
        if kind in ('antidote', 'mender'):
            self.burn_ticks = self.poison_ticks = 0
            self.burn_in = self.poison_in = 0
            self.chaos_heal(1)
            return
        if kind == 'hourglass': self.slowfall_left = 4; return
        if kind == 'curse': self.curse_left = 4; return
        if kind == 'bubble': self.grant_chaos_protection(2); return
        if kind == 'heartburst': self.chaos_heal(3); return
        if kind == 'shatter':
            self.shield = False
            self.chaos_damage(1, 'shatter')
            return
        if kind in PASS_THROUGH_SPEEDS or kind in ('weak', 'pusher', 'spike', 'thunder'): return
        if kind == 'heal': self.chaos_heal(2); return
        if kind == 'shield': self.shield = True; return
        if kind == 'haste':
            self.haste_left = 4
            self.chaos_damage(1, 'haste')
            return
        if kind == 'doom':
            self.damage_taken += self.lives
            self.lives, self.alive, self.death_cause = 0, False, 'doom'
            return
        if self.chaos_damage(7 if kind == 'wild_seven' else 3 if kind in ('meteor', 'boulder') else 2 if kind in ('heavy', 'bomb', 'venom_fang', 'ember', 'frostbite', 'crossfire', 'drill', 'rocket') else 1, kind):
            if kind == 'vertigo': self.vertigo_left = 3
            if kind == 'tar': self.frost_left = max(self.frost_left, 4)
            if kind == 'frostbite': self.frost_left = max(self.frost_left, 1.5)
            if kind in ('ember', 'crossfire'): self.burn_ticks, self.burn_in = 1, 2
            if kind == 'crossfire': self.poison_ticks, self.poison_in = 1, 3
            if kind == 'rust': self.haste_left = self.slowfall_left = self.stasis_left = 0
            if kind == 'drain': self.regen_in = 12
            if kind == 'fire': self.burn_ticks, self.burn_in = 2, 2
            if kind == 'venom_fang': self.poison_ticks, self.poison_in = 2, 3
            if kind == 'poison': self.poison_ticks, self.poison_in = 3, 3
            if kind == 'thorn': self.regen_in = 8
            if kind == 'frost': self.frost_left = 2.5

    def push_player(self, block, movement):
        """Separate solid contact; only a block moving into a wall can crush."""
        from dodge_model import PLAYER_LEFT, PLAYER_RIGHT, PLAYER_BOTTOM, PLAYER_TOP
        half = block.size / 2
        # Push out through the nearest face, including a tiny gap so resting
        # contact does not repeatedly register as penetration.
        offsets = ((block.x-half-self.x-PLAYER_RIGHT-.001, 0),
                   (block.x+half-self.x-PLAYER_LEFT+.001, 0),
                   (0, block.y-half-self.y-PLAYER_TOP-.001),
                   (0, block.y+half-self.y-PLAYER_BOTTOM+.001))
        dx, dy = min(offsets, key=lambda offset: abs(offset[0])+abs(offset[1]))
        if block.kind == 'spike' and dy > 0:
            self.chaos_damage(1, 'spike')
        dx, dy = dx*PUSH_PULL_STRENGTH, dy*PUSH_PULL_STRENGTH
        target_x, target_y = self.x+dx, self.y+dy
        self.x = max(self.left-PLAYER_LEFT, min(self.right-PLAYER_RIGHT, target_x))
        self.y = max(self.bottom-PLAYER_BOTTOM, min(self.top-PLAYER_TOP, target_y))
        blocked = abs(self.x-target_x) > .002 or abs(self.y-target_y) > .002
        if blocked and dx*movement[0]+dy*movement[1] > 1e-9:
            self.chaos_damage(1 if block.kind == 'spike' else 3, block.kind)

    def chaos_fall_speed(self, block):
        if self.stasis_left and block.kind != 'horizontal': return 0
        easy_base = min(340, 100 + self.elapsed * 2.5)
        if block.kind == 'anvil':
            base = min(640, self.speed*(.4 if block.age < 1.2 else 2.4))
        elif block.kind == 'blaster':
            base = easy_base * 1.3 * .75
        elif block.kind == 'sonic':
            base = easy_base * 3.3 * 1.5
        elif block.kind == 'parachute':
            base = min(640, easy_base*2) if block.age < .6 else easy_base/4
        elif block.kind == 'rocket':
            base = easy_base/2 if block.age < 1 else 640
        elif block.kind == 'chaos_nexus':
            base = easy_base / 6
        elif block.kind == 'feather':
            base = easy_base / 2
        elif block.kind == 'surge':
            base = min(640, self.speed * (1.9 - 1.3 * math.cos(block.age * math.pi)))
        elif block.kind == 'snail':
            base = easy_base / 3
        else:
            base = min(640, self.speed * block.speed_multiplier)
        return base * (.6 if self.slowfall_left else 1) * (1.4 if self.curse_left else 1) * self.overlap_speed(block)

    def prepare_field(self, block):
        cycle = int((block.age + 1e-9) // 4)
        if block.kind == 'chaos_nexus' and block.field_cycle != cycle:
            block.field_order = tuple(self.rng.sample(FIELD_MODES, len(FIELD_MODES)))
            block.field_cycle = cycle

    def overlap_speed(self, target):
        from dodge_model import touches_block
        factors = set()
        for source in self.blocks:
            if source is target or source.kind not in PASS_THROUGH_SPEEDS:
                continue
            if target is self:
                overlapping = touches_block(self.x, self.y, source)
            elif source.kind.startswith('elite_'):
                half = (source.size+target.size)/2
                overlapping = any(abs(x-sx) <= half and abs(y-sy) <= half
                                  for x, y in target.centers() for sx, sy in source.centers())
            else:
                continue
            if overlapping: factors.add(PASS_THROUGH_SPEEDS[source.kind])
        return math.prod(factors)

    def cannon_angles(self, block):
        return tuple(angle+block.age*block.rotation_speed for angle in block.cannons)

    def update_blaster(self, block, step):
        if block.kind != 'blaster' and block.kind not in TURRET_BLOCKS: return
        from dodge_model import Block
        block.shot_in -= step
        if block.shot_in > 1e-9: return
        block.shot_in += TURRET_BLOCKS[block.kind]['interval'] if block.kind in TURRET_BLOCKS else self.rng.uniform(.3, .9)
        if block.kind == 'scatter':
            angle = self.rng.randrange(8)*math.pi/4
            block.cannons = (angle-math.pi/4, angle, angle+math.pi/4)
        for angle in self.cannon_angles(block):
            dx, dy = math.cos(angle), math.sin(angle)
            self.pellets.append(Block(block.x+dx*block.size*.8, block.y+dy*block.size*.8,
                                      ((0, 0),), '#ffe394', cell_size=7, kind='blaster_pellet',
                                      velocity_x=dx*240, velocity_y=dy*240))

    def update_pellets(self, step):
        from dodge_model import touches_block
        remaining = []
        for pellet in self.pellets:
            scale = 0 if self.pellet_freeze_left else self.overlap_speed(pellet)
            pellet.x += pellet.velocity_x*step*scale
            pellet.y += pellet.velocity_y*step*scale
            if pellet.kind != 'reflected_pellet' and touches_block(self.x, self.y, pellet):
                self.chaos_damage(.5, 'blaster_pellet')
            elif self.left-10 <= pellet.x <= self.right+10 and self.bottom-10 <= pellet.y <= self.top+10:
                remaining.append(pellet)
        self.pellets = remaining

    def thunder_phase(self, block):
        if block.kind != 'thunder' or block.age+1e-9 < 1:
            return 'idle'
        phase = (block.age+1e-9) % 1
        return 'warning' if phase < .25 else 'strike' if phase < .5 else 'idle'

    def thunder_bounds(self, block):
        half = block.size/2
        return (block.x-half, block.x+half, block.y-half-2*block.size, block.y-half)

    def update_thunder(self, block):
        if self.thunder_phase(block) != 'strike':
            return
        from dodge_model import PLAYER_POLYGON, polygon_touches_rectangle
        left, right, bottom, top = self.thunder_bounds(block)
        if polygon_touches_rectangle(PLAYER_POLYGON, left-self.x, right-self.x,
                                     bottom-self.y, top-self.y):
            self.chaos_damage(2, 'thunder')
            self.haste_left = max(self.haste_left, 1)

    def apply_chaos_aura(self, block):
        effect = AURA_EFFECTS.get(block.kind)
        if not effect or math.hypot(self.x-block.x, self.y-block.y) > AURA_RADIUS:
            return
        if effect == 'poison':
            # Refresh duration without postponing the next damage tick.
            if not self.poison_ticks: self.poison_in = 3
            self.poison_ticks = max(self.poison_ticks, 3)
        elif effect == 'haste':
            self.haste_left = max(self.haste_left, 4)
        elif effect == 'frost':
            self.frost_left = max(self.frost_left, 2.5)

    def chaos_fields(self, step):
        """Accumulate forces before moving anything, so list order cannot affect them."""
        forces = {}
        player_fx = player_fy = 0
        for source in self.blocks:
            radius = FIELD_RADII.get(source.kind)
            if not radius:
                continue
            self.prepare_field(source)
            mode = field_mode(source)
            if self.repellent_left and mode.endswith('player'):
                continue
            targets = (self, *self.blocks) if mode.endswith('all') else self.blocks if mode.endswith('blocks') else (self,)
            for target in targets:
                if target is source or (target is self and self.repellent_left):
                    continue
                vx, vy = source.x-target.x, source.y-target.y
                distance = math.hypot(vx, vy)
                if not 1 < distance < radius:
                    continue
                force = (100 if target is self else 140) * PUSH_PULL_STRENGTH * (1-distance/radius)
                if mode.startswith('push'):
                    force *= -1
                if mode == 'orbit_all':
                    vx, vy = vx*.25-vy*.9, vy*.25+vx*.9
                fx, fy = vx/distance*force, vy/distance*force
                if target is self:
                    player_fx += fx
                    player_fy += fy
                else:
                    old_x, old_y = forces.get(id(target), (0, 0))
                    forces[id(target)] = (old_x+fx, old_y+fy)
        self.x += player_fx*step
        self.y += player_fy*step
        return forces

    def fire_rays(self, block):
        """The exact same edge-clipped rays drive warning art and flame damage."""
        rays = []
        for dx, dy in FIRE_PATTERNS.get(block.kind, ()):
            distances = []
            if dx: distances.append(((self.right if dx > 0 else self.left)-block.x)/dx)
            if dy: distances.append(((self.top if dy > 0 else self.bottom)-block.y)/dy)
            distance = min(distances)
            rays.append((block.x, block.y, block.x+dx*distance, block.y+dy*distance))
        return rays

    def update_fire_pattern(self, block, step):
        if block.kind not in FIRE_PATTERNS:
            return False
        if block.flame_stage == 0:
            if block.y > (self.top+self.bottom)/2:
                return False
            block.x, block.y = (self.left+self.right)/2, (self.top+self.bottom)/2
            block.flame_stage, block.flame_left, block.flame_beeps = 1, 1.5, 1
            self.chaos_sound_events.append('chaos_fire_warning')
            return True
        if block.flame_stage == 1:
            block.flame_left = max(0, block.flame_left-step)
            beeps = min(3, 1+int((1.5-block.flame_left+1e-9)/.5))
            if beeps > block.flame_beeps:
                self.chaos_sound_events.extend(['chaos_fire_warning']*(beeps-block.flame_beeps))
                block.flame_beeps = beeps
            if block.flame_left <= 1e-9:
                block.flame_stage, block.flame_left = 2, .65
                self.chaos_sound_events.append('chaos_fire_burst')
        elif block.flame_stage == 2:
            block.flame_left = max(0, block.flame_left-step)
            if block.flame_left <= 1e-9: block.flame_stage = 3
        return True

    def touches_fire_pattern(self, block):
        if block.flame_stage != 2:
            return False
        for ax, ay, bx, by in self.fire_rays(block):
            dx, dy = bx-ax, by-ay
            length_squared = dx*dx+dy*dy
            t = max(0, min(1, ((self.x-ax)*dx+(self.y-ay)*dy)/length_squared))
            # 12-unit flame radius plus the player contact radius.
            if math.hypot(self.x-(ax+t*dx), self.y-(ay+t*dy)) <= 22:
                return True
        return False

    def update_teleport(self, block, step):
        """Freeze during warnings, then warp to the locked, visible destination."""
        if block.kind not in ('glitch', 'elite_glitch'):
            return False
        elite = block.kind == 'elite_glitch'
        if block.teleports >= 3:
            return False
        if block.screen_age < 0:
            if block.y + block.size/2 > self.top:
                return False
            block.screen_age = 0
        block.screen_age += step
        if block.warning_left > 0:
            block.warning_left -= step
            if block.warning_left <= 1e-9:
                block.x, block.y = block.teleport_target
                block.teleports += 1
                block.warning_left = 0
                block.teleport_target = None
                # A teleport is not a physical close pass through intervening space.
                block.near_player = False
            return True
        near_bottom = block.y <= self.bottom + (self.top-self.bottom)*.25
        if (elite and block.screen_age >= 1-1e-9) or (not elite and near_bottom):
            block.warning_left = 1 if elite else 1.2
            if elite:
                block.teleport_target = (self.x, self.y)
            else:
                angle = self.rng.uniform(0, math.tau)
                distance = self.rng.uniform(50, 100)
                half = block.cell_size/2
                block.teleport_target = (
                    max(self.left+half, min(self.right-half, block.x+math.cos(angle)*distance)),
                    max(self.bottom+half, min(self.top-half, block.y+math.sin(angle)*distance)))
            return True
        return False

    def update_chaos_bounds(self):
        from dodge_model import DIFFICULTIES, PLAYER_LEFT, PLAYER_RIGHT, PLAYER_BOTTOM, PLAYER_TOP
        bounds = DIFFICULTIES['merciless'].bounds if self.arena_shrink_left > 0 else self.rules.bounds
        if bounds == (self.left, self.right, self.bottom, self.top): return
        self.left, self.right, self.bottom, self.top = bounds
        # Bring the player safely inside a newly shrunken arena before lethal
        # edges activate, rather than killing them for an unavoidable resize.
        self.x = max(self.left-PLAYER_LEFT+1, min(self.right-PLAYER_RIGHT-1, self.x))
        self.y = max(self.bottom-PLAYER_BOTTOM+1, min(self.top-PLAYER_TOP-1, self.y))

    def check_chaos_edges(self):
        if not self.danger_edge_left or not self.alive: return
        from dodge_model import PLAYER_LEFT, PLAYER_RIGHT, PLAYER_BOTTOM, PLAYER_TOP
        if (self.x+PLAYER_LEFT <= self.left or self.x+PLAYER_RIGHT >= self.right
                or self.y+PLAYER_BOTTOM <= self.bottom or self.y+PLAYER_TOP >= self.top):
            self.damage_taken += self.lives
            self.lives, self.alive, self.death_cause = 0, False, 'edge'

    def update_chaos(self, dt, keys):
        from dodge_model import Block, PLAYER_LEFT, PLAYER_RIGHT, PLAYER_TOP, PLAYER_BOTTOM, touches_block
        while dt > 0 and self.alive:
            step = min(dt, 1/120)
            dt -= step
            self.elapsed += step
            self.invulnerable = max(0, self.invulnerable-step)
            self.protection_left = max(0, self.protection_left-step)
            self.frost_left = max(0, self.frost_left-step)
            self.haste_left = max(0, self.haste_left-step)
            for timer in ("curse_left", "slowfall_left", "stasis_left", "repellent_left", "vertigo_left", "target_lock_left", "danger_edge_left", "arena_shrink_left", "pellet_freeze_left"):
                setattr(self, timer, max(0, getattr(self, timer)-step))
            self.update_chaos_bounds()
            for effect, interval in (('burn', 2), ('poison', 3)):
                ticks = getattr(self, effect+'_ticks')
                if ticks:
                    timer = getattr(self, effect+'_in')-step
                    if timer <= 1e-9:
                        self.chaos_damage(1, effect, contact=False)
                        ticks -= 1
                        timer += interval
                    setattr(self, effect+'_ticks', ticks)
                    setattr(self, effect+'_in', timer)
            if not self.alive: return
            if self.regeneration_left > 0:
                self.regeneration_in -= min(step, self.regeneration_left)
                self.regeneration_left = max(0, self.regeneration_left-step)
                if self.regeneration_left < 1e-9: self.regeneration_left = 0
                if self.regeneration_in <= 1e-9:
                    self.chaos_heal(1)
                    self.regeneration_in += 1
            self.regen_in -= step
            if self.regen_in <= 1e-9:
                self.chaos_heal(1)
                self.regen_in += 8
            dx = int('Right' in keys)-int('Left' in keys)
            dy = int('Up' in keys)-int('Down' in keys)
            if self.vertigo_left: dx, dy = -dx, -dy
            length = math.hypot(dx, dy) or 1
            speed = 260 * (.5 if self.frost_left else 1) * (1.45 if self.haste_left else 1) * self.overlap_speed(self)
            self.x += dx / length * speed * step
            self.y += dy / length * speed * step
            for block in self.blocks:
                self.reveal_mystery(block)
                block.age += step
            block_forces = self.chaos_fields(step)
            self.check_chaos_edges()
            if not self.alive: return
            self.x = max(self.left-PLAYER_LEFT, min(self.right-PLAYER_RIGHT, self.x))
            self.y = max(self.bottom-PLAYER_BOTTOM, min(self.top-PLAYER_TOP, self.y))
            self.spawn_in -= step
            if self.spawn_in <= 0:
                self.spawn_chaos()
                self.spawn_in += self.spawn_interval
            remaining, children = [], []
            for block in self.blocks:
                old_x, old_y = block.x, block.y
                movement_step = step*self.overlap_speed(block)
                if block.kind == 'boomerang' and not block.bounced and block.age >= 1:
                    block.bounced, block.rise_left = True, 1.2
                if block.kind == 'rewind' and not block.bounced and block.age >= 1.2:
                    block.bounced, block.rise_left = True, .8
                if block.kind == 'comet': block.speed_multiplier = min(4.45, block.speed_multiplier+step*.8)
                held = self.update_fire_pattern(block, step) or self.update_teleport(block, step)
                if not held:
                    fx, fy = block_forces.get(id(block), (0, 0))
                    block.x += fx * movement_step
                    block.y += fy * movement_step
                    if block.kind == 'horizontal':
                        block.x += block.velocity_x*self.chaos_fall_speed(block)*step
                    elif block.kind == 'anti_gravity':
                        block.y += self.chaos_fall_speed(block)*step
                    elif block.kind == 'corkscrew':
                        vertical = -.6 if int((block.age+1e-9)*2) % 2 else 1.6
                        block.y -= self.chaos_fall_speed(block) * vertical * step
                    elif block.rise_left > 0:
                        block.y += self.chaos_fall_speed(block) * step
                        block.rise_left = max(0, block.rise_left-(0 if self.stasis_left else step))
                    else: block.y -= self.chaos_fall_speed(block) * step
                    direction = (-1 if int((block.age+1e-9)*2) % 2 else 1) if block.kind == 'zigzag' else 1
                    if block.kind == 'sawtooth': direction = -1 if int((block.age+1e-9)*4)%2 else 1
                    if block.kind != 'horizontal': block.x += block.velocity_x * direction * movement_step
                    frequency = 6 if block.kind in ('ribbon', 'corkscrew') else 2
                    if block.kind == 'waltz': frequency = 1
                    phase = block.sway_phase + movement_step * frequency
                    block.x += block.sway_amplitude * (math.sin(phase)-math.sin(block.sway_phase))
                    block.sway_phase = phase
                    if self.target_lock_left:
                        block.x = old_x+fx*movement_step+max(-80, min(80, (self.x-old_x)*2))*movement_step
                    if not self.target_lock_left and block.kind == 'skater': block.x += max(-100, min(100, (block.x-self.x)*2))*movement_step
                    if not self.target_lock_left and block.kind == 'seeker': block.x += max(-65, min(65, (self.x-block.x)*2))*movement_step
                    width = max(x for x, y in block.cells)*block.cell_size
                    if block.kind in ("ricochet", "pinball") and (block.x <= self.left+block.cell_size/2 or block.x >= self.right-block.cell_size/2-width):
                        block.velocity_x *= -1
                    if block.kind != 'horizontal':
                        block.x = max(self.left+block.cell_size/2, min(self.right-block.cell_size/2-width, block.x))
                self.reveal_mystery(block)
                self.update_blaster(block, step)
                self.apply_chaos_aura(block)
                self.update_thunder(block)
                if not self.alive: return
                if block.kind in FIRE_PATTERNS:
                    if not held: self.update_fire_pattern(block, 0)
                    if block.flame_stage == 3: continue
                    if self.touches_fire_pattern(block):
                        if self.chaos_damage(3, block.kind):
                            self.burn_ticks, self.burn_in = 1, 2
                        if not self.alive: return
                if block.kind in ('splitter', 'iceburst', 'firecracker') and block.age >= 1.4:
                    shard_kind = {'iceburst': 'frost', 'firecracker': 'fire'}.get(block.kind, 'normal')
                    shard_color = CATALOG[shard_kind]['color'] if shard_kind != 'normal' else block.color
                    for offset in (-22, 0, 22):
                        children.append(Block(max(self.left+7.5, min(self.right-7.5, block.x+offset)), block.y, ((0, 0),), shard_color,
                                              block.speed_multiplier, sway_amplitude=abs(offset), cell_size=15, kind=shard_kind))
                    continue
                solid = block_is_solid(block)
                blast = block.kind == 'bomb' and 2 <= block.age < 2.35
                touching = solid and touches_block(self.x, self.y, block)
                if blast and math.hypot(self.x-block.x, self.y-block.y) <= 65:
                    touching = True
                if touching:
                    if block.kind in ('pusher', 'spike'):
                        self.push_player(block, (block.x-old_x, block.y-old_y))
                        if not self.alive: return
                        remaining.append(block)
                        continue
                    self.chaos_contact(block)
                    if not self.alive: return
                    if block.kind in FIRE_PATTERNS or block.kind in TURRET_BLOCKS or block.kind in ('glitch', 'elite_glitch', 'fan', 'giga_fan', 'blaster'):
                        remaining.append(block)
                    continue  # Glitch blocks persist through their three warned teleports.
                if block.kind == 'bomb' and block.age >= 2.35: continue
                if solid and not block.near_miss_awarded and block.kind not in SAFE_BLOCKS:
                    if touches_block(self.x, self.y, block, 6): block.near_player = True
                    elif block.near_player:
                        self.near_misses += 1
                        block.near_miss_awarded = True
                can_bounce = (block.kind == 'spring' and not block.bounced) or (block.kind == 'pinball' and block.bounce_count < 3) or (block.kind == 'hopper' and block.bounce_count < 2)
                if can_bounce and block.y-block.size/2 <= self.bottom:
                    block.bounce_count += 1
                    block.bounced, block.rise_left = True, .65
                    block.y = self.bottom+block.size/2
                if block.kind in ('fan', 'giga_fan'):
                    from dodge_model import fan_blades
                    highest = max(y for blade in fan_blades(block) for x, y in blade)
                else:
                    highest = max(y for x, y in block.centers())+block.size/2
                exited_side = block.kind == 'horizontal' and (
                    min(x for x, y in block.centers())-block.size/2 > self.right if block.velocity_x > 0
                    else max(x for x, y in block.centers())+block.size/2 < self.left)
                exited_top = block.kind == 'anti_gravity' and min(y for x,y in block.centers())-block.size/2 > self.top
                if (highest < self.bottom and block.kind != 'anti_gravity') or exited_side or exited_top:
                    self.dodged += 1
                else: remaining.append(block)
            self.blocks = (remaining+children)[:80]
            self.update_pellets(step)
            self.check_chaos_edges()
