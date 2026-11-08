"""Chaos-only block catalog and simulation; classic Turtle Dodge stays unchanged."""
import math

# One source for the in-game guide, spawn weights, colors and identifying glyphs.
BLOCK_TYPES = (
    ('normal', 'Wild block', '#63d9ed', 'W', 22, 'Common', '1 damage. Random color, size, speed, shape and sway.'),
    ('wild_seven', 'Wild Seven block', '#63d9ed', '7', 0, 'Rare', '7 contact damage. Spawns 0.8% of the time. Same random colors, shapes, sizes, speeds and sway as Wild, identified by its 7 symbol. Shields and hit protection still work.'),
    ('gravity_well', 'Gravity Well block', '#b79aff', 'GW', 2.5, 'Rare', 'Pulls both you and nearby blocks inward within a large 300-unit ring. 1 contact damage. Repellent protects you from the pull.'),
    ('force_wave', 'Force Wave block', '#80e4db', 'FW', 2.5, 'Rare', 'Pushes both you and nearby blocks outward within a large 300-unit ring. 1 contact damage. Repellent protects you from the push.'),
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
    ('fire_x', 'Fire X block', '#ff9367', 'FX', 2, 'Rare', 'Settles at the arena center, beeps and marks an X for 1.5 seconds, then fires diagonal flame lines to the edges for 0.65 seconds. Flames deal 2 damage and 1 burn damage after 2 seconds. Body contact deals 1 damage.'),
    ('fire_plus', 'Fire Plus block', '#ffb56c', 'F+', 2, 'Rare', 'Settles at the arena center, beeps and marks a + for 1.5 seconds, then fires horizontal and vertical flame lines to the edges for 0.65 seconds. Flames deal 2 damage and 1 burn damage after 2 seconds. Body contact deals 1 damage.'),
    ('fire_star', 'Fire Star block', '#ff7899', 'F*', 1, 'Rare', 'Settles at the arena center, beeps and marks both X and + for 1.5 seconds, then fires all eight flame lines together for 0.65 seconds. Flames deal 2 damage and 1 burn damage after 2 seconds. Body contact deals 1 damage.'),
    ('vortex', 'Vortex block', '#b3a0ff', 'VX', 2.5, 'Rare', 'Swirls you and nearby blocks inward around a 200-unit field. Repellent protects you from the swirl. 1 contact damage.'),
    ('pinball', 'Pinball block', '#f6d37d', 'PB', 4, 'Rare', 'Ricochets off the side walls and bounces upward from the floor 3 times before falling out. 1 damage.'),
    ('iceburst', 'Iceburst block', '#9fe8ff', 'IB', 3, 'Rare', 'Splits into 3 small Frost shards after 1.4 seconds. Each shard deals 1 damage and slows you for 2.5 seconds. The unsplit block deals 1 damage.'),
    ('firecracker', 'Firecracker block', '#ff9f76', 'FC', 3, 'Rare', 'Splits into 3 small Fire shards after 1.4 seconds. Each shard deals 1 damage, then burns for 1 after 2 and 4 seconds. The unsplit block deals 1 damage.'),
    ('sanctuary', 'Sanctuary block', '#a2ffcb', 'SA', 1, 'Rare', 'A safe pickup: heals 2 HP, grants a shield, clears burning, poison, Frost, Curse and Vertigo, and resets delayed natural healing to at most 8 seconds away.'),
    ('vertigo', 'Vertigo block', '#e4a2f1', 'VT', 3, 'Rare', '1 damage and reverses your movement controls for 3 seconds. A shield prevents both. Mender and Sanctuary clear the reversal.'),
    ('comet', 'Comet block', '#81b6ff', '*', 6, 'Uncommon', 'Accelerates as it falls, up to the Chaos speed limit. 1 damage.'),
)
# Keep Wild Seven at exactly 0.8% as the rest of the catalogue grows.
_wild_seven_weight = sum(row[4] for row in BLOCK_TYPES if row[0] != 'wild_seven') * .008 / .992
BLOCK_TYPES = tuple(row[:4] + (_wild_seven_weight,) + row[5:] if row[0] == 'wild_seven' else row for row in BLOCK_TYPES)
CATALOG = {row[0]: dict(zip(('id', 'name', 'color', 'symbol', 'weight', 'rarity', 'description'), row)) for row in BLOCK_TYPES}
SAFE_BLOCKS = frozenset(('sanctuary', 'weak', 'heal', 'shield', 'antidote', 'bubble', 'hourglass', 'heartburst', 'curse', 'mender', 'stasis', 'phoenix', 'aegis', 'mint', 'clockwork', 'repellent', 'lullaby'))
FIRE_PATTERNS = {'fire_x': ((1, 1), (-1, 1), (1, -1), (-1, -1)),
                 'fire_plus': ((1, 0), (-1, 0), (0, 1), (0, -1))}
FIRE_PATTERNS['fire_star'] = FIRE_PATTERNS['fire_x'] + FIRE_PATTERNS['fire_plus']

FIELD_MODES = ('pull_player', 'push_player', 'pull_blocks', 'push_blocks')
FIELD_LABELS = dict(zip(FIELD_MODES, ('PULL YOU', 'PUSH YOU', 'PULL BLOCKS', 'PUSH BLOCKS')))
FIELD_RADII = {'vortex': 200, 'gravity_well': 300, 'force_wave': 300, 'black_hole': 130, 'repulsor': 120, 'block_attractor': 220, 'block_repulsor': 220, 'chaos_nexus': 480}


def block_is_solid(block):
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
        result.append(dict(item, chance=round(item['weight'] / total * 100, 1),
                           preview_cells=block.cells, preview_size=block.cell_size, preview_color=block.color))
    return result


class ChaosRules:
    def setup_chaos(self):
        self.lives = self.max_lives = 8
        self.invulnerable = self.damage_taken = self.healing_collected = 0
        self.regen_in = 8.0
        self.burn_ticks = self.poison_ticks = 0
        self.burn_in = self.poison_in = 0.0
        self.frost_left = self.haste_left = 0.0
        self.curse_left = self.slowfall_left = self.stasis_left = 0.0
        self.repellent_left = self.vertigo_left = 0.0
        self.chaos_sound_events = []
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
        if self.shield: effects.append('SHIELDED')
        return f"Chaos · Heal +1 in {math.ceil(self.regen_in)}s · " + (' / '.join(effects) or 'Collect hearts, shields and antidotes; lightning hurts')

    def spawn_chaos(self, kind=None):
        from dodge_model import Block, CELL, SHAPES, COLORS
        if len(self.blocks) >= 80:
            return
        kind = kind or self.rng.choices(list(CATALOG), weights=[v['weight'] for v in CATALOG.values()])[0]
        info = CATALOG[kind]
        cells = tuple((i, 0) for i in range(6)) if kind == 'long' else self.rng.choice(SHAPES + NEW_SHAPES)
        if kind in ('vortex', 'pinball', 'sanctuary', 'vertigo', 'fire_x', 'fire_plus', 'fire_star', 'gravity_well', 'force_wave', 'phoenix', 'aegis', 'mint', 'clockwork', 'repellent', 'lullaby', 'rocket', 'parachute', 'corkscrew', 'boulder', 'mender', 'stasis', 'venom_fang', 'block_attractor', 'block_repulsor', 'chaos_nexus', 'black_hole', 'repulsor', 'heal', 'shield', 'haste', 'bomb', 'doom', 'antidote', 'sonic', 'snail', 'hourglass', 'bubble', 'heartburst', 'shatter', 'curse', 'glitch', 'elite_glitch'):
            cells = ((0, 0),)
        for _ in range(self.rng.randrange(4)):
            cells = tuple((-y, x) for x, y in cells)
        min_x, min_y = min(x for x, y in cells), min(y for x, y in cells)
        cells = tuple((x-min_x, y-min_y) for x, y in cells)
        if kind == 'drill': cells = tuple((0, i) for i in range(4))
        if kind == 'ribbon': cells = tuple((i, 0) for i in range(5))
        cell = CELL * self.rng.uniform(.55, 1.4)
        speed = self.rng.uniform(.85, 4.45)
        if kind in ('sonic', 'snail'): speed = 1
        if kind in ('glitch', 'elite_glitch'): speed = .8
        if kind in FIRE_PATTERNS: cell, speed = 32, 1
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
        self.blocks.append(block)

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

    def chaos_heal(self, amount):
        healed = min(amount, self.max_lives-self.lives)
        self.lives += healed
        self.healing_collected += healed

    def chaos_contact(self, block):
        kind = block.kind
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
            self.invulnerable = max(self.invulnerable, 1.5)
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
        if kind == 'bubble': self.invulnerable = max(2, self.invulnerable); return
        if kind == 'heartburst': self.chaos_heal(3); return
        if kind == 'shatter':
            self.shield = False
            self.chaos_damage(1, 'shatter')
            return
        if kind == 'weak': return
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

    def chaos_fall_speed(self, block):
        if self.stasis_left: return 0
        easy_base = min(340, 100 + self.elapsed * 2.5)
        if block.kind == 'sonic':
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
        return base * (.6 if self.slowfall_left else 1) * (1.4 if self.curse_left else 1)

    def prepare_field(self, block):
        cycle = int((block.age + 1e-9) // 4)
        if block.kind == 'chaos_nexus' and block.field_cycle != cycle:
            block.field_order = tuple(self.rng.sample(FIELD_MODES, len(FIELD_MODES)))
            block.field_cycle = cycle

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
                force = (100 if target is self else 140) * (1-distance/radius)
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

    def update_chaos(self, dt, keys):
        from dodge_model import Block, PLAYER_LEFT, PLAYER_RIGHT, PLAYER_TOP, PLAYER_BOTTOM, touches_block
        while dt > 0 and self.alive:
            step = min(dt, 1/120)
            dt -= step
            self.elapsed += step
            self.invulnerable = max(0, self.invulnerable-step)
            self.frost_left = max(0, self.frost_left-step)
            self.haste_left = max(0, self.haste_left-step)
            for timer in ("curse_left", "slowfall_left", "stasis_left", "repellent_left", "vertigo_left"):
                setattr(self, timer, max(0, getattr(self, timer)-step))
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
            self.regen_in -= step
            if self.regen_in <= 1e-9:
                self.chaos_heal(1)
                self.regen_in += 8
            dx = int('Right' in keys)-int('Left' in keys)
            dy = int('Up' in keys)-int('Down' in keys)
            if self.vertigo_left: dx, dy = -dx, -dy
            length = math.hypot(dx, dy) or 1
            speed = 260 * (.5 if self.frost_left else 1) * (1.45 if self.haste_left else 1)
            self.x += dx / length * speed * step
            self.y += dy / length * speed * step
            for block in self.blocks:
                block.age += step
            block_forces = self.chaos_fields(step)
            self.x = max(self.left-PLAYER_LEFT, min(self.right-PLAYER_RIGHT, self.x))
            self.y = max(self.bottom-PLAYER_BOTTOM, min(self.top-PLAYER_TOP, self.y))
            self.spawn_in -= step
            if self.spawn_in <= 0:
                self.spawn_chaos()
                self.spawn_in += self.spawn_interval
            remaining, children = [], []
            for block in self.blocks:
                if block.kind == 'rewind' and not block.bounced and block.age >= 1.2:
                    block.bounced, block.rise_left = True, .8
                if block.kind == 'comet': block.speed_multiplier = min(4.45, block.speed_multiplier+step*.8)
                held = self.update_fire_pattern(block, step) or self.update_teleport(block, step)
                if not held:
                    fx, fy = block_forces.get(id(block), (0, 0))
                    block.x += fx * step
                    block.y += fy * step
                    if block.kind == 'corkscrew':
                        vertical = -.6 if int((block.age+1e-9)*2) % 2 else 1.6
                        block.y -= self.chaos_fall_speed(block) * vertical * step
                    elif block.rise_left > 0:
                        block.y += self.chaos_fall_speed(block) * step
                        block.rise_left = max(0, block.rise_left-(0 if self.stasis_left else step))
                    else: block.y -= self.chaos_fall_speed(block) * step
                    direction = (-1 if int((block.age+1e-9)*2) % 2 else 1) if block.kind == 'zigzag' else 1
                    block.x += block.velocity_x * direction * step
                    frequency = 6 if block.kind in ('ribbon', 'corkscrew') else 2
                    phase = block.sway_phase + step * frequency
                    block.x += block.sway_amplitude * (math.sin(phase)-math.sin(block.sway_phase))
                    block.sway_phase = phase
                    if block.kind == 'skater': block.x += max(-100, min(100, (block.x-self.x)*2))*step
                    if block.kind == 'seeker': block.x += max(-65, min(65, (self.x-block.x)*2))*step
                    width = max(x for x, y in block.cells)*block.cell_size
                    if block.kind in ("ricochet", "pinball") and (block.x <= self.left+block.cell_size/2 or block.x >= self.right-block.cell_size/2-width):
                        block.velocity_x *= -1
                    block.x = max(self.left+block.cell_size/2, min(self.right-block.cell_size/2-width, block.x))
                if block.kind in FIRE_PATTERNS:
                    if not held: self.update_fire_pattern(block, 0)
                    if block.flame_stage == 3: continue
                    if self.touches_fire_pattern(block):
                        if self.chaos_damage(2, block.kind):
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
                    self.chaos_contact(block)
                    if not self.alive: return
                    if block.kind in FIRE_PATTERNS or block.kind in ('glitch', 'elite_glitch'):
                        remaining.append(block)
                    continue  # Glitch blocks persist through their three warned teleports.
                if block.kind == 'bomb' and block.age >= 2.35: continue
                if solid and not block.near_miss_awarded and block.kind not in SAFE_BLOCKS:
                    if touches_block(self.x, self.y, block, 6): block.near_player = True
                    elif block.near_player:
                        self.near_misses += 1
                        block.near_miss_awarded = True
                can_bounce = (block.kind == 'spring' and not block.bounced) or (block.kind == 'pinball' and block.bounce_count < 3)
                if can_bounce and block.y-block.size/2 <= self.bottom:
                    block.bounce_count += 1
                    block.bounced, block.rise_left = True, .65
                    block.y = self.bottom+block.size/2
                if max(y for x, y in block.centers())+block.size/2 < self.bottom:
                    self.dodged += 1
                else: remaining.append(block)
            self.blocks = (remaining+children)[:80]
