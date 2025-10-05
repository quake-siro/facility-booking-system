import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// fetchのモック
global.fetch = jest.fn();

describe('施設予約システム', () => {
  beforeEach(() => {
    // 各テスト前にfetchをリセット
    (fetch as jest.Mock).mockClear();
  });

  test('アプリケーションが正常にレンダリングされる', () => {
    render(<App />);
    expect(screen.getByText(/施設予約システム/i)).toBeInTheDocument();
  });

  test('施設一覧が表示される', async () => {
    const mockFacilities = [
      {
        id: 1,
        name: '会議室A',
        description: '最大20名収容の会議室',
        capacity: 20,
        hourly_rate: 5000,
        image_url: '/images/meeting-room-a.jpg'
      }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFacilities
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('会議室A')).toBeInTheDocument();
    });
  });

  test('予約フォームが表示される', async () => {
    const mockFacilities = [
      {
        id: 1,
        name: '会議室A',
        description: '最大20名収容の会議室',
        capacity: 20,
        hourly_rate: 5000,
        image_url: '/images/meeting-room-a.jpg'
      }
    ];

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilities
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    render(<App />);

    await waitFor(() => {
      const bookButton = screen.getByText(/予約する/i);
      fireEvent.click(bookButton);
    });

    expect(screen.getByLabelText(/お名前/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
  });

  test('エラー状態が表示される', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/施設一覧の取得に失敗しました/i)).toBeInTheDocument();
    });
  });
});
