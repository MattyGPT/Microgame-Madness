"""Survival order, teleport collision, fair patterns, and the locked finisher."""

import math
import random
import unittest

from singularity_core import (ATTACKS, BOX_CENTER, ECHO_INTERVAL, ECHO_PREVIEW_DURATION,
                              ECHO_STEPS, HEAL_LASTS, INTRO_DURATION, LASER_DURATION,
                              NODES, TELEPORT_DISTANCE, Hazard, SingularityCore)
from singularity_core_view import SAFE, draw_core
from web.bridge import BrowserGame


class SingularityCoreTests(unittest.TestCase):
    @staticmethod
    def node_keys(node):
        x, y = NODES[node]
        keys = {"Left"} if x < 0 else {"Right"} if x > 0 else set()
        if y != BOX_CENTER[1]:
            keys.add("Down" if y < BOX_CENTER[1] else "Up")
        return keys

    def test_photon_rain_fires_ten_percent_fewer_bullets_at_the_same_speed(self):
        game = SingularityCore()
        game.begin_attack(7)
        game.invulnerable = 1000
        game.update(7.5, set())
        # The old .19-second rhythm fired 40 three-photon volleys in this span.
        self.assertEqual(game.beat * 3, 108)
        self.assertAlmostEqual(1 / ATTACKS[7].interval, .9 / .19)
        self.assertTrue(game.hazards)
        self.assertTrue(all(h.size == 7 and h.vy == -280 for h in game.hazards))

    def test_polarity_inversion_has_another_ten_percent_faster_pulses_and_warnings(self):
        game = SingularityCore()
        game.begin_attack(10)
        game.update(.28, {"Left"})
        self.assertEqual(game.lives, 10)
        self.assertAlmostEqual(game.hazards[0].warning * 1.21, .35)
        self.assertAlmostEqual(game.hazards[0].duration * 1.21, .31)
        game.update(.02, {"Left"})
        self.assertEqual(game.lives, 9)
        game.update(.34, set())
        self.assertEqual(game.beat, 2)  # Second pulse now precedes the previous .691s rhythm.
        self.assertAlmostEqual(1 / ATTACKS[10].interval, 1.1 / (.76 / 1.1))
        self.assertEqual(ATTACKS[10].duration, 7)

    def test_echo_preview_cannot_damage_any_of_the_nine_teleport_positions(self):
        for node in range(9):
            with self.subTest(node=node):
                game = SingularityCore(random.Random(42))
                game.begin_attack(12)
                self.assertTrue(game.echo_preview)
                game.update(.5, self.node_keys(node))
                self.assertTrue(any(h.active for h in game.hazards))
                self.assertTrue(all(h.harmless for h in game.hazards))
                game.update(ECHO_PREVIEW_DURATION - .5, self.node_keys(node))
                self.assertFalse(game.echo_preview)
                self.assertEqual((game.lives, game.damage_taken), (10, 0))

    def test_echo_replays_exactly_four_demonstrated_positions_at_the_same_pace(self):
        game = SingularityCore(random.Random(42))
        game.begin_attack(12)
        game.invulnerable = 1000
        self.assertEqual(len(game.memory), 4)
        self.assertEqual(len(set(game.memory)), 4)
        self.assertAlmostEqual(ECHO_PREVIEW_DURATION, 3.44)
        self.assertAlmostEqual(ATTACKS[12].duration, 6.88)
        preview_patterns = []
        for phase in range(2):
            for step in range(ECHO_STEPS):
                target = phase * ECHO_PREVIEW_DURATION + step * ECHO_INTERVAL + .5
                game.update(target - game.stage_age, set())
                self.assertEqual(game.echo_step, step)
                self.assertEqual(game.echo_preview, phase == 0)
                self.assertEqual(len(game.hazards), 8)
                self.assertTrue(all(h.active and h.harmless == (phase == 0) for h in game.hazards))
                positions = {(h.x, h.y) for h in game.hazards}
                self.assertEqual(positions, set(NODES) - {NODES[game.memory[step]]})
                if phase == 0:
                    preview_patterns.append(positions)
                else:
                    self.assertEqual(positions, preview_patterns[step])

    def test_echo_live_replay_hurts_wrong_nodes_and_matching_the_demo_is_safe(self):
        wrong = SingularityCore(random.Random(42))
        wrong.begin_attack(12)
        wrong_keys = self.node_keys((wrong.memory[0] + 1) % 9)
        wrong.update(ECHO_PREVIEW_DURATION, wrong_keys)
        self.assertEqual(wrong.lives, 10)
        wrong.update(.34, wrong_keys)
        self.assertEqual((wrong.lives, wrong.damage_taken), (9, 1))
        self.assertTrue(all(not h.harmless for h in wrong.hazards))
        correct = SingularityCore(random.Random(42))
        correct.begin_attack(12)
        correct.update(ECHO_PREVIEW_DURATION, set())
        for node in correct.memory:
            correct.update(ECHO_INTERVAL, self.node_keys(node))
        self.assertEqual((correct.lives, correct.damage_taken, correct.attacks_completed), (10, 0, 1))

    def test_echo_renders_an_animated_safe_box_preview_instead_of_text_directions(self):
        game = SingularityCore(random.Random(42))
        game.begin_attack(12)
        for step in range(ECHO_STEPS):
            game.update(step * ECHO_INTERVAL + .4 - game.stage_age, set())
            commands = draw_core(game)
            safe = [command for command in commands if command.get("outline") == SAFE]
            x, y = NODES[game.memory[step]]
            self.assertEqual([command["coords"] for command in safe], [[x-29, -y-29, x+29, -y+29]])
            self.assertEqual(sum(c.get("fill") == "#65f5ff30" for c in commands), 8)
            text = [command.get("text", "") for command in commands]
            self.assertIn("SAFE PREVIEW", text)
            self.assertNotIn("MEMORIZE", text)
            self.assertNotIn("REMEMBER:", game.pattern_label)
        game.update(ECHO_PREVIEW_DURATION + .4 - game.stage_age, set())
        commands = draw_core(game)
        self.assertFalse(any(command.get("outline") == SAFE for command in commands))
        self.assertIn("YOUR TURN", [command.get("text") for command in commands])

    def test_spawns_centered_and_teleports_without_travel_or_release_delay(self):
        game = SingularityCore()
        self.assertEqual((game.x, game.y), BOX_CENTER)
        self.assertEqual((game.lives, game.max_lives, game.healing_collected), (10, 10, 0))
        for horizontal, vertical in ((-1, 0), (1, 0), (0, 1), (0, -1), (-1, 1), (1, -1)):
            keys = ({"Left"} if horizontal < 0 else {"Right"} if horizontal > 0 else set())
            keys |= {"Down"} if vertical < 0 else {"Up"} if vertical > 0 else set()
            game.update(.001, keys)
            self.assertEqual((game.x, game.y), (horizontal * TELEPORT_DISTANCE,
                                              BOX_CENTER[1] + vertical * TELEPORT_DISTANCE))
            game.update(.001, set())
            self.assertEqual((game.x, game.y), BOX_CENTER)
        game.update(.001, {"Left", "Right", "Up", "Down"})
        self.assertEqual((game.x, game.y), BOX_CENTER)

    def test_teleport_does_not_collide_with_the_path_between_nodes(self):
        game = SingularityCore()
        game.begin_attack(3)
        game.spawn_in = 100
        game.hazards = [Hazard("rect", -63, BOX_CENTER[1], 20, 0, 1, height=300)]
        game.update(.01, {"Left"})
        self.assertEqual(game.damage_taken, 0)

    def test_warnings_do_not_hurt_and_real_collisions_remove_one_hp(self):
        game = SingularityCore()
        game.begin_attack(3)
        game.spawn_in = 100
        game.hazards = [Hazard("circle", *BOX_CENTER, 35, .2, .3)]
        game.update(.19, set())
        self.assertEqual(game.lives, 10)
        game.update(.02, set())
        self.assertEqual((game.lives, game.damage_taken), (9, 1))
        game.update(.1, set())
        self.assertEqual(game.lives, 9)

    def test_first_protocol_warns_for_point_seven_two_seconds_before_firing(self):
        game = SingularityCore()
        game.begin_attack(0)
        game.update(.719, {"Left"})
        self.assertEqual(game.lives, 10)
        self.assertTrue(game.hazards)
        self.assertTrue(all(abs(h.warning-.72) < 1e-9 for h in game.hazards))
        game.update(.002, {"Left"})
        self.assertEqual(game.lives, 9)
        game.begin_attack(1)
        game.update(.01, set())
        self.assertAlmostEqual(game.hazards[0].warning, .36)

    def test_circle_ring_and_rotated_beam_collisions_match_their_shapes(self):
        circle = Hazard("circle", 0, 0, 20)
        self.assertTrue(circle.touches(20, 0))
        self.assertFalse(circle.touches(40, 0))
        ring = Hazard("ring", 0, 0, 100, height=10)
        self.assertFalse(ring.touches(0, 0))
        self.assertTrue(ring.touches(100, 0))
        self.assertFalse(ring.touches(130, 0))
        beam = Hazard("beam", 0, 0, 400, height=20, angle=math.pi/2)
        self.assertTrue(beam.touches(0, 126))
        self.assertFalse(beam.touches(126, 0))

    def test_fifteen_attacks_run_once_before_a_new_press_can_fire_the_finisher(self):
        game = SingularityCore(random.Random(42))
        game.invulnerable = 1000
        seen = []
        healing_after = []
        for _ in range(3000):
            completed = game.attacks_completed
            game.update(.05, {"f"})
            if game.attacks_completed != completed:
                if game.attacks_completed % 3 == 0:
                    healing_after.append(game.attacks_completed)
                    self.assertEqual(len(game.healing_pickups), 1)
                    pickup = game.healing_pickups[0]
                    self.assertIn((pickup.x, pickup.y), NODES)
                    self.assertNotEqual((pickup.x, pickup.y), (game.x, game.y))
                    self.assertGreater(pickup.remaining, HEAL_LASTS - .05)
                elif game.attacks_completed < 3:
                    self.assertEqual(game.healing_pickups, [])
            if game.stage == "attack" and (not seen or seen[-1] != game.attack_index):
                seen.append(game.attack_index)
            self.assertEqual(game.hp, 1)
            self.assertFalse(game.won)
            if game.laser_ready:
                break
        else:
            self.fail("The full attack sequence never exposed the Core")
        self.assertEqual(seen, list(range(15)))
        self.assertEqual(game.attacks_completed, 15)
        self.assertEqual(healing_after, [3, 6, 9, 12, 15])
        self.assertFalse(game.shielded)
        self.assertEqual(game.hazards, [])
        game.update(.2, {"f"})
        self.assertEqual(game.stage, "exposed")
        game.update(.01, set())
        game.update(.01, {"f"})
        self.assertEqual(game.stage, "laser")
        self.assertFalse(game.won)
        game.update(LASER_DURATION, set())
        self.assertEqual(game.hp, 0)
        self.assertTrue(game.won)
        self.assertEqual((game.lives, game.healing_collected), (10, 0))
        final = game.elapsed, game.score
        game.update(10, {"f", "Left"})
        self.assertEqual((game.elapsed, game.score), final)

    def test_attack_changes_never_heal_automatically_and_ten_hits_end_the_fight(self):
        game = SingularityCore()
        game.begin_attack(0)
        game.hurt()
        for index in range(15):
            game.begin_attack(index)
            self.assertEqual((game.lives, game.healing_collected), (9, 0))
        for _ in range(9):
            game.invulnerable = 0
            game.hurt()
        self.assertFalse(game.alive)
        self.assertEqual((game.lives, game.damage_taken), (0, 10))
        self.assertIn("TOTAL COLLAPSE", game.death_message)
        game.update(100, {"f"})
        self.assertFalse(game.won)
        self.assertEqual(SingularityCore().lives, 10)

    def test_galactic_pack_heals_one_hp_caps_at_ten_and_keeps_damage_history(self):
        for hp in (8, 9, 10):
            with self.subTest(hp=hp):
                game = SingularityCore(random.Random(42))
                game.lives = hp
                game.damage_taken = 10 - hp
                game.spawn_healing()
                pickup = game.healing_pickups[0]
                keys = {"Right" if pickup.x > 0 else "Left"} if pickup.x else set()
                if pickup.y != BOX_CENTER[1]:
                    keys.add("Up" if pickup.y > BOX_CENTER[1] else "Down")
                commands = draw_core(game)
                self.assertTrue(any(c.get("text") == "+1 HP" for c in commands))
                game.update(.01, keys)
                self.assertEqual(game.lives, min(10, hp + 1))
                self.assertEqual(game.damage_taken, 10 - hp)
                self.assertEqual(game.healing_collected, 1)
                self.assertEqual(game.healing_pickups, [])
                self.assertIn("core_heal", game.sound_events)

    def test_galactic_pack_expires_respects_pause_and_cannot_revive_or_change_victory(self):
        session = BrowserGame()
        session.start("singularity", "gravitron", 0)
        game = session.game
        game.spawn_healing()
        pickup = game.healing_pickups[0]
        session.dispatch(dict(action="pause"))
        session.dispatch(dict(action="tick", dt=.05))
        self.assertEqual(pickup.remaining, HEAL_LASTS)
        session.dispatch(dict(action="pause"))
        game.invulnerable = 1000
        game.update(HEAL_LASTS + .01, set())
        self.assertEqual(game.healing_pickups, [])
        self.assertEqual(game.healing_collected, 0)
        for alive, won in ((False, False), (True, True)):
            game = SingularityCore()
            game.spawn_healing()
            pickup = game.healing_pickups[0]
            game.x, game.y = pickup.x, pickup.y
            game.alive, game.won = alive, won
            game.lives = 0 if not alive else 9
            before = game.lives
            game.update_healing(.01)
            self.assertEqual(game.lives, before)
            self.assertEqual(game.healing_collected, 0)

    def test_every_attack_has_a_safe_teleport_node_and_bounded_hazards(self):
        signatures = set()
        for index, attack in enumerate(ATTACKS):
            with self.subTest(attack=attack.name):
                game = SingularityCore(random.Random(42))
                game.begin_attack(index)
                game.invulnerable = 1000
                signature = set()
                for frame in range(int(attack.duration * 60) - 1):
                    game.update(1 / 60, set())
                    active = [h for h in game.hazards if h.active]
                    self.assertTrue(any(not any(h.touches(*node) for h in active) for node in NODES),
                                    f"No escape in {attack.name} at {game.stage_age:.3f}s")
                    self.assertLessEqual(len(game.hazards), 32)
                    signature.update((frame, h.kind, round(h.x), round(h.y), round(h.size),
                                      round(h.angle, 1), round(h.spin, 1), h.vx, h.vy)
                                     for h in game.hazards)
                    game.sound_events.clear()
                signatures.add(frozenset(signature))
        self.assertEqual(len(signatures), 15)

    def test_bridge_pauses_resumes_renders_all_protocols_and_drains_audio(self):
        session = BrowserGame()
        state = session.dispatch(dict(action="start", mode="singularity", difficulty="gravitron"))
        self.assertEqual((state["lives"], state["max_lives"], state["attack_total"]), (10, 10, 15))
        self.assertTrue(state["shielded"])
        for index in range(15):
            session.game.begin_attack(index)
            session.game.invulnerable = 1000
            session.game.update(2.5, set())
            state = session.snapshot()
            self.assertTrue(state["commands"])
            self.assertEqual(state["sounds"], ["core_protocol"])
            self.assertEqual(session.snapshot()["sounds"], [])
            self.assertEqual(sum(c["kind"] == "clip_start" for c in state["commands"]), 1)
            self.assertEqual(sum(c["kind"] == "clip_end" for c in state["commands"]), 1)
        session.dispatch(dict(action="pause"))
        position, elapsed = (session.game.x, session.game.y), session.game.elapsed
        session.dispatch(dict(action="tick", dt=.05, keys=["Left", "f"]))
        self.assertEqual(((session.game.x, session.game.y), session.game.elapsed), (position, elapsed))
        session.dispatch(dict(action="pause"))
        session.dispatch(dict(action="tick", dt=.05, keys=["Left"]))
        self.assertEqual(session.game.x, -TELEPORT_DISTANCE)
        self.assertTrue(draw_core(session.game))

    def test_browser_laser_action_requires_all_attacks_and_respects_pause(self):
        session = BrowserGame()
        session.start("singularity", "gravitron", 0)
        session.dispatch(dict(action="laser"))
        self.assertEqual(session.game.stage, "intro")
        session.game.stage = "exposed"
        session.dispatch(dict(action="laser"))
        self.assertEqual(session.game.stage, "exposed")
        session.game.attacks_completed = 15
        session.dispatch(dict(action="pause"))
        session.dispatch(dict(action="laser"))
        self.assertEqual(session.game.stage, "exposed")
        session.dispatch(dict(action="pause"))
        state = session.dispatch(dict(action="laser"))
        self.assertTrue(state["laser_firing"])
        self.assertEqual(state["sounds"], ["core_laser"])
        session.game.stage_age = .4
        session.dispatch(dict(action="laser"))
        self.assertEqual(session.game.stage_age, .4)
