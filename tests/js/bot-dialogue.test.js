// Tes logika dialog bot. Jalankan: node --test tests/js   (Node 18+, tanpa dependensi)
const test = require("node:test");
const assert = require("node:assert/strict");
const { LINES, MOODS, PERSONA, pickCategory, createSpeaker } = require("../../static/js/bot-dialogue.js");

const LEVELS = ["easy", "medium", "hard"];
const CATEGORIES = ["start", "rematch", "move", "block", "threat", "fork", "playerBlock", "win", "lose", "draw"];

test("setiap tingkat kesulitan punya persona dan semua kategori berisi variasi kalimat", () => {
  for (const level of LEVELS) {
    assert.ok(PERSONA[level].name && PERSONA[level].title);
    for (const category of CATEGORIES) {
      const pool = LINES[level][category];
      assert.ok(pool && pool.length >= 4, `${level}.${category} minimal 4 kalimat`);
      assert.equal(new Set(pool).size, pool.length, `${level}.${category} tidak boleh ada duplikat`);
      assert.ok(MOODS[category][level], `mood ${category}.${level}`);
    }
  }
});

test("hasil ronde: bot menang -> win, pemain menang -> lose, seri -> draw", () => {
  assert.equal(pickCategory({ actor: "bot", status: "won", winner: "bot" }), "win");
  assert.equal(pickCategory({ actor: "player", status: "won", winner: "player" }), "lose");
  assert.equal(pickCategory({ actor: "player", status: "draw", winner: null }), "draw");
  assert.equal(pickCategory({ actor: "bot", status: "draw", winner: null }), "draw");
});

test("langkah bot yang cerdas punya prioritas: fork > threat > block", () => {
  const base = { actor: "bot", status: "in_progress", winner: null };
  assert.equal(pickCategory({ ...base, kind: "fork" }), "fork");
  assert.equal(pickCategory({ ...base, kind: "threat" }), "threat");
  assert.equal(pickCategory({ ...base, kind: "block" }), "block");
});

test("bot diam setelah langkah pemain yang biasa saat game masih berjalan", () => {
  assert.equal(pickCategory({ actor: "player", status: "in_progress", winner: null, kind: "fork" }), null);
});

test("reaksi opsional mengikuti peluang (rng dikendalikan)", () => {
  const ev = { actor: "bot", status: "in_progress", winner: null, kind: "normal" };
  assert.equal(pickCategory(ev, () => 0.0), "move");
  assert.equal(pickCategory(ev, () => 0.99), null);
  assert.equal(pickCategory({ ...ev, playerKind: "block" }, () => 0.0), "playerBlock");
  assert.equal(pickCategory({ ...ev, playerKind: "block" }, () => 0.99), null);
});

test("speaker tidak mengulang kalimat dalam 2 pemanggilan terakhir dan mengembalikan mood", () => {
  const speaker = createSpeaker("hard");
  let previous = [];
  for (let i = 0; i < 60; i++) {
    const { text, mood, category } = speaker.line("block");
    assert.equal(category, "block");
    assert.equal(mood, MOODS.block.hard);
    assert.ok(!previous.includes(text), "kalimat berulang");
    previous = [...previous, text].slice(-2);
  }
});

test("semua kalimat dalam satu kategori akhirnya muncul (acak, bukan urutan tetap)", () => {
  const speaker = createSpeaker("easy");
  const seen = new Set();
  for (let i = 0; i < 300; i++) seen.add(speaker.line("start").text);
  assert.equal(seen.size, LINES.easy.start.length);
});

test("tingkat kesulitan tidak dikenal jatuh ke medium; kategori tak dikenal -> null", () => {
  assert.equal(createSpeaker("godlike").level, "medium");
  assert.equal(createSpeaker("hard").line("tidak-ada"), null);
});

test("kalimat contoh dari permintaan tersedia", () => {
  assert.ok(LINES.hard.start.includes("Jangan harap bisa menang di mode Hard!"));
  assert.ok(LINES.medium.block.includes("Langkah yang bagus, tapi aku sudah tahu!"));
  assert.ok(LINES.medium.threat.includes("Satu langkah lagi untuk kemenanganku..."));
  assert.ok(LINES.easy.start.some((t) => t.startsWith("Halo, manusia! Semoga beruntung")));
});
