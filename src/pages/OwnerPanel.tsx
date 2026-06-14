import React, { useState, useEffect } from 'react';
import styles from './OwnerPanel.module.css';

interface OwnerPanelProps {
  onAuthenticated?: (token: string) => void;
}

interface SecurityStatus {
  is_locked: boolean;
  failed_attempts: number;
  locked_until: string | null;
}

export const OwnerPanel: React.FC<OwnerPanelProps> = ({ onAuthenticated }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    checkSecurityStatus();
  }, []);

  const checkSecurityStatus = async () => {
    try {
      const response = await fetch('/api/owner/security-status');
      const data = await response.json();
      setSecurityStatus(data);
    } catch (err) {
      console.error('Ошибка получения статуса безопасности:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (securityStatus?.is_locked) {
      setError('Аккаунт заблокирован. Попробуйте позже.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/owner/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setToken(data.token);
        setPassword('');
        if (onAuthenticated) {
          onAuthenticated(data.token);
        }
      } else {
        setError(data.detail || 'Ошибка входа');
        checkSecurityStatus();
      }
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/owner/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setIsAuthenticated(false);
      setToken('');
    } catch (err) {
      console.error('Ошибка выхода:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <h1>🔐 Панель владельца</h1>
          <p className={styles.subtitle}>Введите пароль для доступа</p>

          {securityStatus?.is_locked && (
            <div className={styles.alertDanger}>
              ⚠️ Аккаунт заблокирован до {new Date(securityStatus.locked_until || '').toLocaleString('ru-RU')}
            </div>
          )}

          {securityStatus && securityStatus.failed_attempts > 0 && (
            <div className={styles.alertWarning}>
              ⚠️ Неудачных попыток: {securityStatus.failed_attempts} из {5}
            </div>
          )}

          {error && <div className={styles.alertDanger}>{error}</div>}

          <form onSubmit={handleLogin} className={styles.form}>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || securityStatus?.is_locked}
              autoFocus
              className={styles.input}
            />
            <button
              type="submit"
              disabled={loading || securityStatus?.is_locked}
              className={styles.button}
            >
              {loading ? '⏳ Проверка...' : '🔓 Вход'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.adminPanel}>
        <div className={styles.header}>
          <h1>👑 Панель владельца ЕЦСУ</h1>
          <button onClick={handleLogout} className={styles.logoutButton}>
            🚪 Выход
          </button>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>Управление приложением</h2>
            <div className={styles.grid}>
              <div className={styles.card}>
                <h3>📊 Статистика</h3>
                <p>Общие показатели системы</p>
              </div>
              <div className={styles.card}>
                <h3>⚙️ Параметры</h3>
                <p>Конфигурация системы</p>
              </div>
              <div className={styles.card}>
                <h3>🔌 Плагины</h3>
                <p>Управление расширениями</p>
              </div>
              <div className={styles.card}>
                <h3>📋 Логи</h3>
                <p>История событий</p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>🔒 Безопасность</h2>
            <div className={styles.securityBox}>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className={styles.secondaryButton}
              >
                {showPasswordChange ? '✖️ Отменить' : '🔑 Изменить пароль'}
              </button>
              {showPasswordChange && <ChangePasswordForm token={token} />}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

interface ChangePasswordFormProps {
  token: string;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ token }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/owner/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.detail || 'Ошибка изменения пароля');
      }
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input
        type="password"
        placeholder="Текущий пароль"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        disabled={loading}
        required
      />
      <input
        type="password"
        placeholder="Новый пароль"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        disabled={loading}
        required
      />
      <input
        type="password"
        placeholder="Подтверждение пароля"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={loading}
        required
      />
      {error && <div className={styles.alertDanger}>{error}</div>}
      {message && <div className={styles.alertSuccess}>{message}</div>}
      <button type="submit" disabled={loading}>
        {loading ? '⏳ Сохранение...' : '💾 Сохранить'}
      </button>
    </form>
  );
};
