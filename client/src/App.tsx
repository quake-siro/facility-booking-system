import React, { useState, useEffect } from 'react';
import './App.css';

interface Facility {
  id: number;
  name: string;
  description: string;
  capacity: number;
  hourly_rate: number;
  image_url: string;
}

interface Booking {
  id: number;
  facility_id: number;
  user_name: string;
  user_email: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
  facility_name: string;
}

function App() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    user_name: '',  user_email: '',  start_time: '',
    end_time: ''  });

  const API_BASE_URL = 'http://localhost:5000/api';
  
  useEffect(() => {
    fetchFacilities();
    fetchBookings();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('施設一覧を取得中...', `${API_BASE_URL}/facilities`);
      
      const response = await fetch(`${API_BASE_URL}/facilities`);
      console.log('施設一覧レスポンス:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('施設一覧データ:', data);
      setFacilities(data);
    } catch (error) {
      console.error('施設一覧の取得に失敗しました:', error);
      setError(`施設一覧の取得に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      console.log('予約一覧を取得中...', `${API_BASE_URL}/bookings`);
      
      const response = await fetch(`${API_BASE_URL}/bookings`);
      console.log('予約一覧レスポンス:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('予約一覧データ:', data);
      setBookings(data);
    } catch (error) {
      console.error('予約一覧の取得に失敗しました:', error);
      // 予約一覧のエラーは施設一覧ほど重要ではないので、エラー状態は設定しない
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility) return;

    const startTime = new Date(bookingForm.start_time);
    const endTime = new Date(bookingForm.end_time);
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // 時間単位に変換
    const totalPrice = Math.ceil(hours) * selectedFacility.hourly_rate;

    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facility_id: selectedFacility.id,
          user_name: bookingForm.user_name,
          user_email: bookingForm.user_email,
          start_time: bookingForm.start_time,
          end_time: bookingForm.end_time,
          total_price: totalPrice
        }),
      });

      if (response.ok) {
        alert('予約が完了しました！');
        setShowBookingForm(false);
        setBookingForm({ user_name: '', user_email: '', start_time: '', end_time: '' });
        fetchBookings();
      } else {
        const error = await response.json();
        alert(`予約に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error('予約の作成に失敗しました:', error);
      alert('予約の作成に失敗しました');
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('この予約をキャンセルしますか？')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('予約をキャンセルしました');
        fetchBookings();
      } else {
        alert('キャンセルに失敗しました');
      }
    } catch (error) {
      console.error('予約のキャンセルに失敗しました:', error);
      alert('予約のキャンセルに失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>🏢 施設予約システム</h1>
        </header>
        <main className="App-main">
          <div className="loading">
            <p>データを読み込み中...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏢 施設予約システム</h1>
      </header>

      <main className="App-main">
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchFacilities} style={{marginTop: 10, padding: '8px 16px' }}>
              再試行
            </button>
          </div>
        )}

        <section className="facilities-section">
          <h2>施設一覧</h2>
          <div className="facilities-grid">
            {facilities.length === 0 ? (
              <p style={{ color: 'white', gridColumn: '1 / -1' }}>
                施設が見つかりません
              </p>
            ) : (
              facilities.map((facility) => (
                <div key={facility.id} className="facility-card">
                  <div className="facility-image">
                    <img src={facility.image_url} alt={facility.name} />
                  </div>
                  <div className="facility-info">
                    <h3>{facility.name}</h3>
                    <p>{facility.description}</p>
                    <div className="facility-details">
                      <span>定員: {facility.capacity}名</span>
                      <span>料金: ¥{facility.hourly_rate.toLocaleString()}/時間</span>
                    </div>
                    <button
                      className="book-button"
                      onClick={() => {
                        setSelectedFacility(facility);
                        setShowBookingForm(true);
                      }}
                    >
                      予約する
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {showBookingForm && selectedFacility && (
          <section className="booking-form-section">
            <h2>📅 予約フォーム - {selectedFacility.name}</h2>
            <form onSubmit={handleBookingSubmit} className="booking-form">
              <div className="form-group">
                <label>お名前:</label>
                <input
                  type="text"
                  value={bookingForm.user_name}
                  onChange={(e) => setBookingForm({...bookingForm, user_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>メールアドレス:</label>
                <input
                  type="email"
                  value={bookingForm.user_email}
                  onChange={(e) => setBookingForm({...bookingForm, user_email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>開始時間:</label>
                <input
                  type="datetime-local"
                  value={bookingForm.start_time}
                  onChange={(e) => setBookingForm({...bookingForm, start_time: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>終了時間:</label>
                <input
                  type="datetime-local"
                  value={bookingForm.end_time}
                  onChange={(e) => setBookingForm({...bookingForm, end_time: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-button">予約確定</button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowBookingForm(false)}
                >
                  キャンセル
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="bookings-section">
          <h2>📋 予約一覧</h2>
          <div className="bookings-list">
            {bookings.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center' }}>
                予約がありません
              </p>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-info">
                    <h3>{booking.facility_name}</h3>
                    <p>予約者: {booking.user_name}</p>
                    <p>開始: {new Date(booking.start_time).toLocaleString()}</p>
                    <p>終了: {new Date(booking.end_time).toLocaleString()}</p>
                    <p>料金: ¥{booking.total_price.toLocaleString()}</p>
                    <p>ステータス: {booking.status === 'confirmed' ? '確定' : 'キャンセル'}</p>
                  </div>
                  {booking.status === 'confirmed' && (
                    <button
                      className="cancel-booking-button"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      キャンセル
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
