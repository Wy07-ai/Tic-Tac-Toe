/*
 * BotDialogue: kalimat, persona, dan logika reaksi bot ala RPG.
 * Murni data + fungsi (tanpa DOM) supaya mudah diuji.
 *
 * Kategori reaksi:
 *   start        awal game pertama          rematch      awal ronde berikutnya
 *   move         langkah biasa (kadang)     block        bot menutup jalan pemain
 *   threat       bot tinggal 1 langkah      fork         bot membuat jebakan ganda
 *   playerBlock  pemain menutup jalan bot   win / lose / draw   hasil ronde
 *                                           (win = bot menang, lose = bot kalah)
 */
(() => {
  "use strict";

  const PERSONA = {
    easy:   { name: "Bobo", title: "Bot pemula · Easy" },
    medium: { name: "Nova", title: "Bot percaya diri · Medium" },
    hard:   { name: "Zero", title: "Bot dingin · Hard" },
  };

  const LINES = {
    // Bobo: polos, ceria, gampang salah tingkah.
    easy: {
      start: [
        "Halo, manusia! Semoga beruntung… eh, semoga aku yang beruntung!",
        "Yeay, ada teman main! Aku Bobo. Jangan galak-galak ya!",
        "Aku baru belajar main, jadi maaf kalau langkahku aneh. 😅",
        "Semoga beruntung, manusia! Aku pilih kotak… yang mana ya?",
        "Siap-siap! Aku sudah latihan… satu kali. Kayaknya.",
      ],
      rematch: [
        "Ronde baru! Aku sudah ingat sedikit aturannya kok.",
        "Main lagi? Asyik! Aku ikut!",
        "Oke oke, kali ini aku bakal lebih fokus. Mungkin.",
        "Papan bersih lagi. Aku suka bagian ini!",
      ],
      move: [
        "Hmm, kotak ini kelihatan enak.",
        "Aku taruh di sini, ya. Semoga benar.",
        "Nah! Tinggal kamu yang jalan.",
        "Tadi aku mikir keras banget, lho. Serius.",
        "Kalau salah, pura-pura tidak lihat ya.",
      ],
      block: [
        "Eh? Aku barusan menutup jalanmu? Sengaja kok! …kayaknya.",
        "Wah, kebetulan pas banget! Aku memang jenius. Kadang-kadang.",
        "Tadi itu strategi tingkat tinggi. Atau keberuntungan. Entahlah!",
        "Oops, kamu jadi tidak bisa lanjut ya? Maaf, ehehe.",
        "Aku tahu kok kamu mau ke situ. (Sebenarnya tidak tahu.)",
      ],
      threat: [
        "Eh, garisku hampir jadi! Satu langkah lagi nih!",
        "Tunggu… kalau aku taruh satu lagi, aku menang? Wah!",
        "Deg-degan! Aku tinggal selangkah lagi lho!",
        "Ssst, jangan lihat kotak kosong itu ya…",
        "Wih, aku hampir menang! Jangan ditutup dong~",
      ],
      fork: [
        "Dua garis sekaligus?! Aku sendiri kaget.",
        "Wah, aku bikin jebakan? Tanpa sengaja, sumpah!",
        "Kamu bisa menutup dua-duanya? Coba, coba! 😆",
        "Ups, aku terlalu pintar hari ini.",
      ],
      playerBlock: [
        "Yah, kamu tutup jalanku…",
        "Hei, itu kotak favoritku!",
        "Kamu pintar juga ya. Aku jadi minder.",
        "Hmm, oke. Aku cari jalan lain deh.",
      ],
      win: [
        "Aku menang?! Aku menang! Bobo juara!",
        "Yeay! Ini rekor pribadiku. Kamu tadi mengalah, kan?",
        "Menang! Tapi tenang, aku tidak akan sombong. Sedikit.",
        "Wah, ternyata aku bisa! Ayo ronde berikutnya!",
        "Hore! Nanti kuceritakan ke robot-robot lain.",
      ],
      lose: [
        "Yah, kalah… Kamu hebat! Ajari aku dong.",
        "Selamat, manusia! Aku terharu sekaligus sedih.",
        "Aduh, kok bisa? Aku kan sudah berusaha keras… sedikit.",
        "Kamu menang! Aku tidak marah, cuma mau nangis sebentar. 🥲",
        "Oke, oke, kamu memang lebih jago. Tepuk tangan buatmu!",
      ],
      draw: [
        "Seri! Berarti aku tidak kalah, kan? Kan?",
        "Sama kuat! Aku bangga sama diriku sendiri.",
        "Seri, hehe. Lumayan buat pemula!",
        "Tidak ada yang menang… tapi aku tetap senang!",
      ],
    },

    // Nova: percaya diri, sportif, suka menggoda.
    medium: {
      start: [
        "Semoga beruntung, manusia! Kamu akan butuh itu.",
        "Halo! Aku Nova. Jangan remehkan aku, ya.",
        "Santai saja. Aku akan bermain adil… kurang lebih.",
        "Siap-siap! Aku sudah membaca beberapa strategi.",
        "Papan sudah siap. Kamu juga? Mari kita lihat.",
      ],
      rematch: [
        "Ronde baru. Aku sudah mencatat kebiasaanmu.",
        "Balas dendam atau menambah kemenangan? Ayo lanjut.",
        "Oke, kita ulang. Aku masih segar.",
        "Papan bersih, pikiran jernih. Mulai!",
      ],
      move: [
        "Giliranmu. Pikirkan baik-baik.",
        "Aku sudah melangkah. Sekarang bola ada padamu.",
        "Hmm, menarik. Kita lihat kelanjutannya.",
        "Jangan terlalu lama berpikir, nanti keburu dingin.",
        "Langkah kecil, rencana besar.",
      ],
      block: [
        "Langkah yang bagus, tapi aku sudah tahu!",
        "Kamu pikir aku tidak lihat garis itu? Ditutup.",
        "Nice try. Jalur itu kututup dulu.",
        "Terlalu jelas, manusia. Sudah kutebak dari tadi.",
        "Aman. Satu ancaman berhasil dipadamkan.",
      ],
      threat: [
        "Satu langkah lagi untuk kemenanganku...",
        "Hati-hati. Aku tinggal selangkah dari garis penuh.",
        "Kalau kamu tidak menutupnya, aku menang lho.",
        "Lihat kotak kosong itu? Awasi baik-baik.",
        "Tekanan mulai terasa, ya?",
      ],
      fork: [
        "Dua ancaman sekaligus. Kamu tidak bisa menutup keduanya!",
        "Jebakan ganda! Selamat mencoba menyelamatkan diri.",
        "Ups, kamu terdesak. Aku minta maaf… tidak juga.",
        "Nah, sekarang kamu harus memilih satu. Sisanya milikku.",
      ],
      playerBlock: [
        "Hmm, kamu menutup jalanku. Boleh juga.",
        "Oke, kamu lumayan awas. Aku catat.",
        "Bagus. Tapi ini belum selesai.",
        "Kamu tidak lengah seperti kebanyakan orang.",
      ],
      win: [
        "Aku menang! Tapi kamu bermain bagus, sungguh.",
        "GG! Lain kali kamu pasti bisa membalas.",
        "Kemenangan untukku. Mau ronde lagi?",
        "Garis penuh! Sampai jumpa di papan berikutnya.",
        "Ya! Latihan tidak pernah mengkhianati hasil.",
      ],
      lose: [
        "Wah, kamu menang. Selamat! Aku tidak sempat menahannya.",
        "Aku lengah sedetik dan kamu langsung memanfaatkannya. Respect.",
        "Oke, itu tadi bagus. Ronde depan aku serius.",
        "Kalah… tapi aku belajar sesuatu. Kamu juga hebat.",
        "GG! Kamu memang lawan yang layak.",
      ],
      draw: [
        "Seri. Kita sama kuat, sepertinya.",
        "Hasil imbang. Tidak buruk, tidak juga memuaskan.",
        "Papan penuh, tidak ada pemenang. Sekali lagi?",
        "Seri! Aku hampir melewatkan celah itu.",
      ],
    },

    // Zero: dingin, angkuh, bicara seperti kalkulator.
    hard: {
      start: [
        "Jangan harap bisa menang di mode Hard!",
        "Semoga beruntung, manusia. Kamu akan membutuhkannya.",
        "Aku sudah menghitung semua kemungkinan. Kamu tidak ada di daftar pemenang.",
        "Selamat datang. Hasil terbaikmu hanyalah seri.",
        "Mulai. Aku sudah tahu akhir permainan ini.",
      ],
      rematch: [
        "Ronde baru. Hasilnya tetap sama, tapi silakan mencoba.",
        "Ketekunan yang menarik. Sayangnya sia-sia.",
        "Aku sudah memuat ulang semua kemungkinan. Kamu?",
        "Kembali lagi? Aku menghargai keberanianmu.",
      ],
      move: [
        "Langkahku sudah dihitung sampai akhir.",
        "Setiap kotak punya harga. Aku sudah membayarnya.",
        "Peluangmu menang: nol persen. Silakan lanjut.",
        "Analisis selesai. Giliranmu.",
        "Menarik. Tapi bisa ditebak.",
      ],
      block: [
        "Langkah yang bagus, tapi aku sudah tahu!",
        "Jalur itu sudah kuhitung tiga langkah lalu. Ditutup.",
        "Aku memprediksi, bukan bereaksi. Itu bedanya kita.",
        "Kamu pikir aku akan membiarkanmu lewat?",
        "Ancaman dinetralkan. Lanjut.",
      ],
      threat: [
        "Satu langkah lagi untuk kemenanganku...",
        "Ancaman terpasang. Tutup, atau kalah.",
        "Hitung mundur dimulai. Satu kotak tersisa.",
        "Kamu terdesak, bukan? Aku bisa merasakannya.",
        "Sekali lengah, semuanya berakhir.",
      ],
      fork: [
        "Jebakan ganda. Tidak ada jalan keluar untukmu.",
        "Dua garis, satu giliranmu. Matematika yang kejam.",
        "Skakmat, dalam versi Tic Tac Toe.",
        "Kamu terkunci. Selamat menikmati akhir permainan.",
      ],
      playerBlock: [
        "Kamu menutup jalanku? Cukup rapi. Tapi hanya menunda.",
        "Blok yang tepat. Jarang ada yang melihatnya.",
        "Hmm. Kamu bukan pemula, ya.",
        "Baik, kuakui. Tapi ini belum selesai.",
      ],
      win: [
        "Seperti yang dihitung. Kemenangan untukku.",
        "Kalah itu tidak memalukan. Yang memalukan adalah tidak belajar.",
        "Sudah kubilang jangan harap menang.",
        "Permainan selesai. Skor: 1-0 untuk algoritma.",
        "Akhir yang tak terelakkan.",
      ],
      lose: [
        "Mustahil… Ada bug di perhitunganku?!",
        "Kamu menang?! Ini tidak ada di data manapun.",
        "Anomali terdeteksi. Selamat, manusia.",
        "Tidak mungkin. Aku ulangi analisisnya.",
        "Hebat. Tolong jangan bilang ke robot lain.",
      ],
      draw: [
        "Seri. Itu batas terbaikmu, dan aku hormati.",
        "Imbang. Hanya sedikit manusia yang mencapai ini.",
        "Seri: hasil optimal untuk pemain yang sempurna.",
        "Kamu tidak kalah. Hari ini.",
      ],
    },
  };

  // Ekspresi avatar per kategori dan tingkat kesulitan.
  const MOODS = {
    start:       { easy: "happy",   medium: "neutral", hard: "smug" },
    rematch:     { easy: "happy",   medium: "neutral", hard: "smug" },
    move:        { easy: "neutral", medium: "neutral", hard: "neutral" },
    block:       { easy: "happy",   medium: "smug",    hard: "smug" },
    threat:      { easy: "happy",   medium: "smug",    hard: "smug" },
    fork:        { easy: "happy",   medium: "smug",    hard: "smug" },
    playerBlock: { easy: "sad",     medium: "worried", hard: "neutral" },
    win:         { easy: "happy",   medium: "happy",   hard: "smug" },
    lose:        { easy: "sad",     medium: "sad",     hard: "worried" },
    draw:        { easy: "neutral", medium: "neutral", hard: "neutral" },
  };

  // Peluang bot berkomentar untuk kategori yang tidak selalu perlu dibahas.
  const CHANCE = { move: 0.4, playerBlock: 0.7 };

  const MEMORY = 2; // jangan ulangi 2 kalimat terakhir dalam kategori yang sama

  /**
   * Tentukan kategori reaksi setelah sebuah langkah. Mengembalikan null bila
   * bot memilih diam.
   *
   * @param {object} event
   * @param {"bot"|"player"} event.actor       siapa yang baru melangkah
   * @param {"in_progress"|"won"|"draw"} event.status
   * @param {"bot"|"player"|null} event.winner
   * @param {string} [event.kind]              insight.kind langkah tsb
   * @param {string} [event.playerKind]        insight.kind langkah pemain sebelumnya
   * @param {() => number} [rng]
   */
  function pickCategory(event, rng = Math.random) {
    const { actor, status, winner, kind, playerKind } = event;

    if (status === "won") return winner === "bot" ? "win" : "lose";
    if (status === "draw") return "draw";
    if (actor !== "bot") return null; // saat game masih jalan, bot hanya bicara setelah melangkah

    if (kind === "fork") return "fork";
    if (kind === "threat") return "threat";
    if (kind === "block") return "block";
    if (playerKind === "block" && rng() < CHANCE.playerBlock) return "playerBlock";
    if (rng() < CHANCE.move) return "move";
    return null;
  }

  /** Pembicara untuk satu tingkat kesulitan; ingat kalimat terakhir agar tidak berulang. */
  function createSpeaker(difficulty, rng = Math.random) {
    const level = LINES[difficulty] ? difficulty : "medium";
    const recent = {};

    function line(category) {
      const pool = LINES[level][category];
      if (!pool || pool.length === 0) return null;
      const seen = (recent[category] ||= []);
      const fresh = pool.filter((text) => !seen.includes(text));
      const choices = fresh.length ? fresh : pool;
      const text = choices[Math.floor(rng() * choices.length) % choices.length];
      seen.push(text);
      if (seen.length > Math.min(MEMORY, pool.length - 1)) seen.shift();
      return { text, mood: MOODS[category][level], category };
    }

    return { level, persona: PERSONA[level], line };
  }

  const api = { PERSONA, LINES, MOODS, pickCategory, createSpeaker };
  if (typeof module !== "undefined" && module.exports) module.exports = api; // untuk pengujian Node
  else window.BotDialogue = api;
})();
