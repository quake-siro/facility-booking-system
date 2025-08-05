const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
// ミドルウェア
app.use(cors());
app.use(express.json());

// データベース初期化
const db = new sqlite3.Database('./facility.db', (err) => {
  if (err) {
    console.error('データベース接続エラー:', err.message);
  } else {
    console.log('SQLiteデータベースに接続しました');
    initDatabase();
  }
});

// データベーステーブル作成
function initDatabase() {
  // 施設テーブル
  db.run(`CREATE TABLE IF NOT EXISTS facilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    capacity INTEGER,
    hourly_rate INTEGER,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 予約テーブル
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    facility_id INTEGER,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    total_price INTEGER,
    status TEXT DEFAULT 'confirmed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities (id)
  )`);

  // サンプルデータ挿入
  insertSampleData();
}

// サンプルデータ挿入
function insertSampleData() {
  const facilities = [
    {
      name: '会議室A',
      description: '最大20名収容の会議室',
      capacity: 20,
      hourly_rate: 5000,
      image_url: '/images/meeting-room-a.jpg'
    },
    {
      name: '会議室B',
      description: '最大10名収容の会議室',
      capacity: 10,
      hourly_rate: 3000,
      image_url: '/images/meeting-room-b.jpg'
    },
    {
      name: '多目的ホール',
      description: 'イベントやセミナーに最適な大ホール',
      capacity: 100,
      hourly_rate: 15000,
      image_url: '/images/hall.jpg'
    }
  ];

  facilities.forEach(facility => {
    db.run(`INSERT OR IGNORE INTO facilities (name, description, capacity, hourly_rate, image_url) 
            VALUES (?, ?, ?, ?, ?)`,
      [facility.name, facility.description, facility.capacity, facility.hourly_rate, facility.image_url]);
  });
}

// API エンドポイント

// 施設一覧取得
app.get('/api/facilities', (req, res) => {
  db.all('SELECT * FROM facilities ORDER BY name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 施設詳細取得
app.get('/api/facilities/:id', (req, res) => {
  db.get('SELECT * FROM facilities WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '施設が見つかりません' });
      return;
    }
    res.json(row);
  });
});

// 予約作成
app.post('/api/bookings', (req, res) => {
  const { facility_id, user_name, user_email, start_time, end_time, total_price } = req.body;
  
  // 入力検証
  if (!facility_id || !user_name || !user_email || !start_time || !end_time) {
    res.status(400).json({ error: '必須項目が不足しています' });
    return;
  }

  // 重複予約チェック
  db.get(`SELECT * FROM bookings 
          WHERE facility_id = ? AND status = 'confirmed' AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
    [facility_id, start_time, start_time, end_time, end_time], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (row) {
        res.status(409).json({ error: '指定された時間帯は既に予約されています' });
        return;
      }

      // 予約作成
      db.run(`INSERT INTO bookings (facility_id, user_name, user_email, start_time, end_time, total_price)
              VALUES (?, ?, ?, ?, ?, ?)`,
        [facility_id, user_name, user_email, start_time, end_time, total_price],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({
            id: this.lastID,
            message: '予約が完了しました'
          });
        });
    });
});

// 予約一覧取得
app.get('/api/bookings', (req, res) => {
  db.all(`SELECT b.*, f.name as facility_name 
          FROM bookings b 
          JOIN facilities f ON b.facility_id = f.id 
          ORDER BY b.created_at DESC`,  (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 予約キャンセル
app.put('/api/bookings/:id/cancel', (req, res) => {
  db.run('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '予約が見つかりません' });
      return;
    }
    res.json({ message: '予約をキャンセルしました' });
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
}); 