const request = require('supertest');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// テスト用のデータベースファイル
const TEST_DB_PATH = './test_facility.db';

// テスト用のアプリケーションを作成
const app = express();
app.use(express.json());

// テスト用のデータベース接続
let testDb;

beforeAll((done) => {
  testDb = new sqlite3.Database(TEST_DB_PATH, (err) => {
    if (err) {
      console.error('テストデータベース接続エラー:', err.message);
    } else {
      console.log('テストSQLiteデータベースに接続しました');
      initTestDatabase();
    }
  });

  function initTestDatabase() {
    // 施設テーブル
    testDb.run(`CREATE TABLE IF NOT EXISTS facilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      capacity INTEGER,
      hourly_rate INTEGER,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 予約テーブル
    testDb.run(`CREATE TABLE IF NOT EXISTS bookings (
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
    )`, done);
  }
});

afterAll((done) => {
  testDb.close((err) => {
    if (err) {
      console.error('テストデータベースクローズエラー:', err.message);
    }
    // テスト用データベースファイルを削除
    const fs = require('fs');
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    done();
  });
});

beforeEach((done) => {
  // 各テスト前にテーブルをクリア
  testDb.run('DELETE FROM bookings', () => {
    testDb.run('DELETE FROM facilities', () => {
      // テスト用のサンプルデータを挿入
      testDb.run(`INSERT INTO facilities (name, description, capacity, hourly_rate, image_url) 
                  VALUES (?, ?, ?, ?, ?)`,
        ['テスト会議室', 'テスト用会議室', 10, 3000, '/test.jpg'], done);
    });
  });
});

// APIエンドポイントのテスト
describe('API エンドポイント', () => {
  // 施設一覧取得のテスト
  test('GET /api/facilities - 施設一覧を取得', (done) => {
    request(app)
      .get('/api/facilities')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('name');
        expect(res.body[0]).toHaveProperty('description');
        done();
      });
  });

  // 施設詳細取得のテスト
  test('GET /api/facilities/:id - 施設詳細を取得', (done) => {
    request(app)
      .get('/api/facilities/1')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).toHaveProperty('id', 1);
        expect(res.body).toHaveProperty('name');
        expect(res.body).toHaveProperty('description');
        done();
      });
  });

  // 予約作成のテスト
  test('POST /api/bookings - 新しい予約を作成', (done) => {
    const newBooking = {
      facility_id: 1,
      user_name: 'テストユーザー',
      user_email: 'test@example.com',
      start_time: '2024-01-01T10:00:00',
      end_time: '2024-01-01T12:00:00',
      total_price: 6000
    };

    request(app)
      .post('/api/bookings')
      .send(newBooking)
      .expect(201)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('user_name', 'テストユーザー');
        expect(res.body).toHaveProperty('status', 'confirmed');
        done();
      });
  });

  // 予約一覧取得のテスト
  test('GET /api/bookings - 予約一覧を取得', (done) => {
    request(app)
      .get('/api/bookings')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(Array.isArray(res.body)).toBe(true);
        done();
      });
  });
});

// エラーハンドリングのテスト
describe('エラーハンドリング', () => {
  test('存在しない施設IDでエラーが返される', (done) => {
    request(app)
      .get('/api/facilities/999')
      .expect(404)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).toHaveProperty('error');
        done();
      });
  });

  test('無効な予約データでエラーが返される', (done) => {
    const invalidBooking = {
      facility_id: 1,
      // 必須フィールドが不足
    };

    request(app)
      .post('/api/bookings')
      .send(invalidBooking)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).toHaveProperty('error');
        done();
      });
  });
}); 