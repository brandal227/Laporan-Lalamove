const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ganti <username>, <password>, dan <dbname> dengan kredensial MongoDB Atlas Anda
const uri = "mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => console.log('Berhasil terhubung ke MongoDB Atlas'))
  .catch(err => console.error('Koneksi database gagal:', err));

// Skema Database untuk Laporan Lalamove
const laporanSchema = new mongoose.Schema({
  storageKey: { type: String, required: true, unique: true }, // Contoh: 'laporan_lalamove_januari_2026' atau 'lalamove_bonus_2026-01'
  data: mongoose.Schema.Types.Mixed // Bisa menyimpan Array (tabel master) atau Number (bonus)
}, { timestamps: true });

const Laporan = mongoose.model('Laporan', laporanSchema);

// API untuk Mengambil Data Berdasarkan Key
app.get('/api/laporan/:key', async (req, res) => {
  try {
    const record = await Laporan.findOne({ storageKey: req.params.key });
    if (record) {
      res.json({ sukses: true, data: record.data });
    } else {
      res.json({ sukses: true, data: null });
    }
  } catch (error) {
    res.status(500).json({ sukses: false, pesan: error.message });
  }
});

// API untuk Menyimpan/Memperbarui Data Berdasarkan Key
app.post('/api/laporan', async (req, res) => {
  try {
    const { storageKey, data } = req.body;
    if (!storageKey) {
      return res.status(400).json({ sukses: false, pesan: 'Storage key diperlukan' });
    }

    // Update jika sudah ada, buat baru jika belum ada (Upsert)
    await Laporan.findOneAndUpdate(
      { storageKey: storageKey },
      { data: data },
      { upsert: true, new: true }
    );

    res.json({ sukses: true, pesan: 'Data berhasil disinkronkan ke MongoDB Atlas' });
  } catch (error) {
    res.status(500).json({ sukses: false, pesan: error.message });
  }
});

// Jalankan Server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});