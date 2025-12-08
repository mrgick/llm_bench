import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../App';
import { Button, Input } from '../components/ui';

export const Profile: React.FC = () => {
  const { token, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user && user.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

      if (password && password !== confirmPassword) {
        setMessage('Пароли не совпадают');
      return;
    }

    if (!user || !token) return;

    try {
      const updateData: any = { email };
      if (password) updateData.password = password;

      // Note: Endpoint /users/{id}/ allows PUT/PATCH
      await api.request(`/users/${user.id}/`, 'PATCH', updateData, token);
      setMessage('Профиль успешно обновлён');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage('Не удалось обновить профиль');
      console.error(error);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-6">Настройки профиля</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">Имя пользователя</label>
            <div className="mt-1 p-2 bg-gray-100 rounded-md text-gray-600">
                {user?.username}
            </div>
        </div>

        <Input
          label="Электронная почта"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Сменить пароль</h3>
          <Input
            label="Новый пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Оставьте пустым, чтобы не менять"
          />
          <Input
            label="Подтвердите новый пароль"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {message && (
          <div className={`p-2 text-sm rounded ${message.includes('успешно') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit">Сохранить профиль</Button>
        </div>
      </form>
    </div>
  );
};