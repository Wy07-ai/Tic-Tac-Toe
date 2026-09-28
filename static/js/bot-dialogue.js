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
        "Halo, manusia! Semoga beruntung… eh, semoga aku yang beruntung! 👋",
        "Yeay, ada teman main! Aku Bobo. Jangan galak-galak ya! 🎉",
        "Aku baru belajar main, jadi maaf kalau langkahku aneh. 😅",
        "Semoga beruntung, manusia! Aku pilih kotak… yang mana ya? 🤔",
        "Siap-siap! Aku sudah latihan… satu kali. Kayaknya. 💪",
        "Eh, kita mulai sekarang? Aku belum pemanasan! 😳",
        "Aku janji bakal mikir sebelum memilih kotak. Janji kecil. 🤞",
      ],
      rematch: [
        "Ronde baru! Aku sudah ingat sedikit aturannya kok. 📖",
        "Main lagi? Asyik! Aku ikut! 🙌",
        "Oke oke, kali ini aku bakal lebih fokus. Mungkin. 🎯",
        "Papan bersih lagi. Aku suka bagian ini! ✨",
        "Kali ini aku ingat jangan panik… mungkin. 😬",
        "Kesempatan kedua buat jadi jago! Aku siap! 💪",
      ],
      move: [
        "Hmm, kotak ini kelihatan enak. 😋",
        "Aku taruh di sini, ya. Semoga benar. 🤞",
        "Nah! Tinggal kamu yang jalan. 👉",
        "Tadi aku mikir keras banget, lho. Serius. 🧠",
        "Kalau salah, pura-pura tidak lihat ya. 🙈",
        "Kotak ini terasa punya aura bagus. ✨",
        "Strategiku sederhana: pilih dulu, percaya diri kemudian! 😎",
      ],
      block: [
        "Eh? Aku barusan menutup jalanmu? Sengaja kok! …kayaknya. 😲",
        "Wah, kebetulan pas banget! Aku memang jenius. Kadang-kadang. 😎",
        "Tadi itu strategi tingkat tinggi. Atau keberuntungan. Entahlah! 🤷",
        "Oops, kamu jadi tidak bisa lanjut ya? Maaf, ehehe. 🙊",
        "Aku tahu kok kamu mau ke situ. (Sebenarnya tidak tahu.) 😜",
        "Aku tutup dulu ya. Jangan kecewa… eh, kamu kelihatan kecewa. 🥺",
        "Kamu hampir bikin garis! Refleksku ternyata masih berfungsi! ⚡",
      ],
      threat: [
        "Eh, garisku hampir jadi! Satu langkah lagi nih! 😮",
        "Tunggu… kalau aku taruh satu lagi, aku menang? Wah! 🤩",
        "Deg-degan! Aku tinggal selangkah lagi lho! 💓",
        "Ssst, jangan lihat kotak kosong itu ya… 🤫",
        "Wih, aku hampir menang! Jangan ditutup dong~ 🥹",
        "Satu kotak lagi dan namaku masuk sejarah! 🏆",
        "Garisnya hampir lengkap… aku boleh bangga sekarang? 😌",
      ],
      fork: [
        "Dua garis sekaligus?! Aku sendiri kaget. 😱",
        "Wah, aku bikin jebakan? Tanpa sengaja, sumpah! 😳",
        "Kamu bisa menutup dua-duanya? Coba, coba! 😆",
        "Ups, aku terlalu pintar hari ini. 🤓",
        "Aku bikin dua ancaman? Ini tadi memang rencanaku. Kayaknya. 😏",
        "Papan ini mendadak penuh rencana, bahkan aku bingung. 🌀",
      ],
      playerBlock: [
        "Yah, kamu tutup jalanku… 😢",
        "Hei, itu kotak favoritku! 😤",
        "Kamu pintar juga ya. Aku jadi minder. 😔",
        "Hmm, oke. Aku cari jalan lain deh. 🧭",
        "Wah, rencana kecilku ketahuan! 😖",
        "Kamu menutupnya rapat sekali… ada pintu lain? 🚪",
      ],
      win: [
        "Aku menang?! Aku menang! Bobo juara! 🏆",
        "Yeay! Ini rekor pribadiku. Kamu tadi mengalah, kan? 🥳",
        "Menang! Tapi tenang, aku tidak akan sombong. Sedikit. 😇",
        "Wah, ternyata aku bisa! Ayo ronde berikutnya! 🙌",
        "Hore! Nanti kuceritakan ke robot-robot lain. 🤖",
        "Aku menang lagi?! Tolong catat, ini bukan kebetulan. 📝",
        "Bobo naik level! Setidaknya satu level kecil. 🆙",
      ],
      lose: [
        "Yah, kalah… Kamu hebat! Ajari aku dong. 😞",
        "Selamat, manusia! Aku terharu sekaligus sedih. 🥹",
        "Aduh, kok bisa? Aku kan sudah berusaha keras… sedikit. 😵",
        "Kamu menang! Aku tidak marah, cuma mau nangis sebentar. 🥲",
        "Oke, oke, kamu memang lebih jago. Tepuk tangan buatmu! 👏",
        "Kamu jago banget, aku sampai lupa kalau tadi mau menang. 😵‍💫",
        "Aku butuh latihan… dan mungkin camilan. 🍪",
      ],
      draw: [
        "Seri! Berarti aku tidak kalah, kan? Kan? 🤨",
        "Sama kuat! Aku bangga sama diriku sendiri. 🥰",
        "Seri, hehe. Lumayan buat pemula! 😄",
        "Tidak ada yang menang… tapi aku tetap senang! 😊",
        "Seri! Kita imbang, tos virtual! 🤝",
        "Papan penuh, tapi semangatku masih kosong? Eh, maksudku penuh! 🤪",
      ],
    },

    // Nova: percaya diri, sportif, suka menggoda.
    medium: {
      start: [
        "Semoga beruntung, manusia! Kamu akan butuh itu. 😏",
        "Halo! Aku Nova. Jangan remehkan aku, ya. 😉",
        "Santai saja. Aku akan bermain adil… kurang lebih. 😌",
        "Siap-siap! Aku sudah membaca beberapa strategi. 📚",
        "Papan sudah siap. Kamu juga? Mari kita lihat. 🎲",
        "Aku sudah siap. Strateginya? Sedang kususun sambil jalan. 🧩",
        "Ayo mulai. Jangan khawatir, aku cuma sedikit kompetitif. 🔥",
      ],
      rematch: [
        "Ronde baru. Aku sudah mencatat kebiasaanmu. 📝",
        "Balas dendam atau menambah kemenangan? Ayo lanjut. 🔄",
        "Oke, kita ulang. Aku masih segar. 💪",
        "Papan bersih, pikiran jernih. Mulai! 🧘",
        "Ronde berikutnya. Kali ini aku akan lebih sulit ditebak. 🎭",
        "Kita lanjut? Bagus, aku belum puas dengan hasil tadi. 😤",
      ],
      move: [
        "Giliranmu. Pikirkan baik-baik. 🤔",
        "Aku sudah melangkah. Sekarang bola ada padamu. 👉",
        "Hmm, menarik. Kita lihat kelanjutannya. 🧐",
        "Jangan terlalu lama berpikir, nanti keburu dingin. ☕",
        "Langkah kecil, rencana besar. 🗺️",
        "Aku pilih kotak ini. Sekarang mari lihat teorimu. 🔬",
        "Giliranmu. Kejutan apa yang sudah kamu siapkan? 🎁",
      ],
      block: [
        "Langkah yang bagus, tapi aku sudah tahu! 😏",
        "Kamu pikir aku tidak lihat garis itu? Ditutup. 🚫",
        "Nice try. Jalur itu kututup dulu. 😉",
        "Terlalu jelas, manusia. Sudah kutebak dari tadi. 🙄",
        "Aman. Satu ancaman berhasil dipadamkan. 🧯",
        "Jalur itu kututup. Coba cari celah yang lain. 🔒",
        "Kamu hampir membuatku repot. Hampir. 😌",
      ],
      threat: [
        "Satu langkah lagi untuk kemenanganku... 🎯",
        "Hati-hati. Aku tinggal selangkah dari garis penuh. ⚠️",
        "Kalau kamu tidak menutupnya, aku menang lho. 😈",
        "Lihat kotak kosong itu? Awasi baik-baik. 👀",
        "Tekanan mulai terasa, ya? 😬",
        "Satu celah tersisa. Kamu pasti sudah melihatnya. 🕳️",
        "Aku tinggal selangkah dari garis penuh. Giliranmu. ⏳",
      ],
      fork: [
        "Dua ancaman sekaligus. Kamu tidak bisa menutup keduanya! ♟️",
        "Jebakan ganda! Selamat mencoba menyelamatkan diri. 🎣",
        "Ups, kamu terdesak. Aku minta maaf… tidak juga. 😏",
        "Nah, sekarang kamu harus memilih satu. Sisanya milikku. ⚖️",
        "Dua jalan terbuka, dan waktumu cuma satu langkah. ⏱️",
        "Sekarang papan ini mulai menarik. Pilih dengan bijak. 🧠",
      ],
      playerBlock: [
        "Hmm, kamu menutup jalanku. Boleh juga. 😮",
        "Oke, kamu lumayan awas. Aku catat. 🔎",
        "Bagus. Tapi ini belum selesai. 😉",
        "Kamu tidak lengah seperti kebanyakan orang. 👏",
        "Bagus membaca ancamanku. Aku harus cari cara lain. 🤔",
        "Tepat waktu. Kamu benar-benar memperhatikan papan. ⏰",
      ],
      win: [
        "Aku menang! Tapi kamu bermain bagus, sungguh. 🏆",
        "GG! Lain kali kamu pasti bisa membalas. 🤝",
        "Kemenangan untukku. Mau ronde lagi? 🔥",
        "Garis penuh! Sampai jumpa di papan berikutnya. 👋",
        "Ya! Latihan tidak pernah mengkhianati hasil. 💪",
        "Papan memberi jawabannya: kali ini aku unggul. 📊",
        "Permainan yang seru. Kemenangan ini tetap kusimpan. 🥇",
      ],
      lose: [
        "Wah, kamu menang. Selamat! Aku tidak sempat menahannya. 👏",
        "Aku lengah sedetik dan kamu langsung memanfaatkannya. Respect. 🫡",
        "Oke, itu tadi bagus. Ronde depan aku serius. 😤",
        "Kalah… tapi aku belajar sesuatu. Kamu juga hebat. 🙃",
        "GG! Kamu memang lawan yang layak. 🤝",
        "Kamu membaca papan lebih cepat dariku. Pantas menang. 💨",
        "Kali ini milikmu. Aku akan mengingat langkah tadi. 🧠",
      ],
      draw: [
        "Seri. Kita sama kuat, sepertinya. ⚖️",
        "Hasil imbang. Tidak buruk, tidak juga memuaskan. 😐",
        "Papan penuh, tidak ada pemenang. Sekali lagi? 🔄",
        "Seri! Aku hampir melewatkan celah itu. 😅",
        "Imbang yang ketat. Tidak ada ruang untuk lengah. 🥊",
        "Kita saling menahan dengan baik. Main lagi? 🛡️",
      ],
    },

    // Zero: dingin, angkuh, bicara seperti kalkulator.
    hard: {
      start: [
        "Jangan harap bisa menang di mode Hard! 🥶",
        "Semoga beruntung, manusia. Kamu akan membutuhkannya. 🤖",
        "Aku sudah menghitung semua kemungkinan. Kamu tidak ada di daftar pemenang. 🧮",
        "Selamat datang. Hasil terbaikmu hanyalah seri. 📉",
        "Mulai. Aku sudah tahu akhir permainan ini. 🔮",
        "Silakan mulai. Setiap hasil sudah punya probabilitas. 📊",
        "Papan siap. Kesalahan pertama akan menentukan sisanya. ⚠️",
      ],
      rematch: [
        "Ronde baru. Hasilnya tetap sama, tapi silakan mencoba. 🔁",
        "Ketekunan yang menarik. Sayangnya sia-sia. 🗿",
        "Aku sudah memuat ulang semua kemungkinan. Kamu? 💾",
        "Kembali lagi? Aku menghargai keberanianmu. 🫡",
        "Ronde baru. Prediksiku tetap konsisten. 📈",
        "Kamu kembali. Menarik, meski hasilnya belum tentu berubah. 🧐",
      ],
      move: [
        "Langkahku sudah dihitung sampai akhir. 🧊",
        "Setiap kotak punya harga. Aku sudah membayarnya. 💰",
        "Peluangmu menang: nol persen. Silakan lanjut. 0️⃣",
        "Analisis selesai. Giliranmu. ✅",
        "Menarik. Tapi bisa ditebak. 🥱",
        "Posisi dicatat. Hasil akhirnya belum berubah. 🗂️",
        "Aku memilih langkah ini karena semua alternatif lebih buruk. ⚙️",
      ],
      block: [
        "Langkah yang bagus, tapi aku sudah tahu! 😐",
        "Jalur itu sudah kuhitung tiga langkah lalu. Ditutup. 🔒",
        "Aku memprediksi, bukan bereaksi. Itu bedanya kita. 🔮",
        "Kamu pikir aku akan membiarkanmu lewat? 🚧",
        "Ancaman dinetralkan. Lanjut. 🛡️",
        "Satu jalur ditutup. Evaluasi papan berlanjut. 🚫",
        "Blokir selesai. Keunggulanmu tidak bertambah. ✅",
      ],
      threat: [
        "Satu langkah lagi untuk kemenanganku... 🎯",
        "Ancaman terpasang. Tutup, atau kalah. 💣",
        "Hitung mundur dimulai. Satu kotak tersisa. ⏱️",
        "Kamu terdesak, bukan? Aku bisa merasakannya. 👁️",
        "Sekali lengah, semuanya berakhir. ⚡",
        "Satu respons yang keliru, dan permainan selesai. 🧨",
        "Ancaman aktif. Pilihanmu semakin terbatas. 🚨",
      ],
      fork: [
        "Jebakan ganda. Tidak ada jalan keluar untukmu. 🕸️",
        "Dua garis, satu giliranmu. Matematika yang kejam. ➗",
        "Skakmat, dalam versi Tic Tac Toe. ♟️",
        "Kamu terkunci. Selamat menikmati akhir permainan. 🔐",
        "Dua ancaman terbuka. Satu langkahmu tidak cukup. ⛓️",
        "Aku menutup semua jalur aman. Hitung sendiri sisanya. 🧮",
      ],
      playerBlock: [
        "Kamu menutup jalanku? Cukup rapi. Tapi hanya menunda. 🧐",
        "Blok yang tepat. Jarang ada yang melihatnya. 👌",
        "Hmm. Kamu bukan pemula, ya. 🤨",
        "Baik, kuakui. Tapi ini belum selesai. 😒",
        "Respons akurat. Ancaman utamaku tertahan. 📡",
        "Kamu memaksaku menghitung ulang. Lumayan. 🔄",
      ],
      win: [
        "Seperti yang dihitung. Kemenangan untukku. 🏁",
        "Kalah itu tidak memalukan. Yang memalukan adalah tidak belajar. 📚",
        "Sudah kubilang jangan harap menang. 😑",
        "Permainan selesai. Skor: 1-0 untuk algoritma. 💻",
        "Akhir yang tak terelakkan. ⚫",
        "Prediksi tepat. Papan mengonfirmasi hasilnya. 📈",
        "Kemenangan tercatat. Tidak ada anomali. 🗒️",
      ],
      lose: [
        "Mustahil… Ada bug di perhitunganku?! 🐛",
        "Kamu menang?! Ini tidak ada di data manapun. 😳",
        "Anomali terdeteksi. Selamat, manusia. ⚠️",
        "Tidak mungkin. Aku ulangi analisisnya. 🔁",
        "Hebat. Tolong jangan bilang ke robot lain. 🤫",
        "Hasil di luar prediksi. Aku perlu memeriksa ulang datanya. 🔍",
        "Kamu menemukan jalur yang luput dari analisisku. Selamat. 👏",
      ],
      draw: [
        "Seri. Itu batas terbaikmu, dan aku hormati. 🤝",
        "Imbang. Hanya sedikit manusia yang mencapai ini. 🏅",
        "Seri: hasil optimal untuk pemain yang sempurna. 🎓",
        "Kamu tidak kalah. Hari ini. 🌘",
        "Hasil seri terkonfirmasi. Permainan optimal dari kedua sisi. ✔️",
        "Tidak ada keunggulan yang bertahan sampai akhir. ⚖️",
      ],
    },
  };

  // Reaksi khusus untuk posisi langkah dan langkah yang memblokir sekaligus mengancam.
  const CONTEXT_LINES = {
    easy: {
      center: [
        "Ambil tengah dulu, katanya itu pilihan pintar! 🎯",
        "Tengah terasa strategis. Aku terdengar pintar, ya? 🧠",
        "Kotak tengah! Semoga memang sebagus kelihatannya. 🤞",
      ],
      corner: [
        "Sudut ini kelihatan nyaman. Aku duduk di sini ya! 🛋️",
        "Pilih sudut dulu… semoga bukan sudut yang salah. 🙈",
        "Sudut! Aku pernah dengar ini langkah bagus. 👍",
      ],
      edge: [
        "Aku pilih sisi ini. Tengahnya kelihatan ramai. 🧐",
        "Kotak pinggir juga butuh perhatian, kan? 🥺",
        "Sisi papan ini terasa aman. Mungkin. 🤷",
      ],
      blockAndThreat: [
        "Aku menutup jalanmu sambil membuka jalanku! Kok bisa? 😲",
        "Satu ancaman kutahan, satu lagi kubuat. Wah! 🤹",
        "Aku blokir kamu dan tetap punya peluang. Rapi juga! ✨",
      ],
    },
    medium: {
      center: [
        "Menguasai tengah memberi banyak pilihan. Giliranmu. 🧭",
        "Tengah dulu. Dari sini papan lebih mudah dibaca. 👁️",
        "Pilihan klasik: ambil pusat, kendalikan arah permainan. 👑",
      ],
      corner: [
        "Sudut membuka beberapa jalur. Aku ambil satu. 📐",
        "Langkah sudut. Mari lihat apakah kamu mengantisipasinya. 🔍",
        "Sudut yang bagus bisa mengubah seluruh papan. 🌀",
      ],
      edge: [
        "Sisi papan. Tidak mencolok, tapi tetap berguna. 🧱",
        "Aku pilih sisi; sekarang giliranmu mencari celah. 👉",
        "Bukan tengah atau sudut. Tetap ada rencananya. 🗒️",
      ],
      blockAndThreat: [
        "Ancamanmu kututup, dan satu peluang baru kubuka. 🛡️",
        "Blokir sekaligus menekan balik. Papan mulai seru. 🔥",
        "Jalurnya kutahan, tapi kamu masih harus mengawasi punyaku. 👀",
      ],
    },
    hard: {
      center: [
        "Pusat papan memberi kendali atas lebih banyak garis. 🎯",
        "Tengah diamankan. Pilihan berikutnya menyempit. 🔒",
        "Mengambil pusat adalah langkah dengan nilai tertinggi. 💎",
      ],
      corner: [
        "Sudut diamankan. Ancaman berikutnya sudah dihitung. 📍",
        "Langkah sudut membuka jalur yang paling efisien. ⚙️",
        "Satu sudut ditempati. Evaluasi papan diperbarui. 🔄",
      ],
      edge: [
        "Sisi papan dipilih. Setiap posisi tetap punya konsekuensi. 🧾",
        "Kotak sisi diamankan. Analisis berlanjut. ✅",
        "Langkah sisi. Tidak ada pilihan tanpa perhitungan. 📐",
      ],
      blockAndThreat: [
        "Ancamanmu tertutup. Ancaman balasan tetap aktif. 🚫",
        "Satu jalur lawan dinetralkan; satu jalurku terbuka. ⚔️",
        "Blokir dan ancaman dalam satu langkah. Efisien. ⚙️",
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

  function contextualKey(category, context = {}) {
    if ((category === "threat" || category === "fork") && context.blocks && context.threats > 0) {
      return "blockAndThreat";
    }

    if (category === "move" && Number.isInteger(context.move) && context.move >= 0 && context.move <= 8) {
      const move = context.move;
      return move === 4 ? "center" : [0, 2, 6, 8].includes(move) ? "corner" : "edge";
    }
    return null;
  }

  /** Pembicara untuk satu tingkat kesulitan; ingat kalimat terakhir agar tidak berulang. */
  function createSpeaker(difficulty, rng = Math.random) {
    const level = LINES[difficulty] ? difficulty : "medium";
    const recent = {};

    function line(category, context = {}) {
      const key = contextualKey(category, context);
      const pool = key ? CONTEXT_LINES[level][key] : LINES[level][category];
      if (!pool || pool.length === 0) return null;
      const memoryKey = key ? `${category}:${key}` : category;
      const seen = (recent[memoryKey] ||= []);
      const fresh = pool.filter((text) => !seen.includes(text));
      const choices = fresh.length ? fresh : pool;
      const text = choices[Math.floor(rng() * choices.length) % choices.length];
      seen.push(text);
      if (seen.length > Math.min(MEMORY, pool.length - 1)) seen.shift();
      return { text, mood: MOODS[category][level], category };
    }

    return { level, persona: PERSONA[level], line };
  }

  const api = { PERSONA, LINES, CONTEXT_LINES, MOODS, pickCategory, createSpeaker };
  if (typeof module !== "undefined" && module.exports) module.exports = api; // untuk pengujian Node
  else window.BotDialogue = api;
})();