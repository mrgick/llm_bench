import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../App';
import { LLM, LLMUser } from '../types';
import { Button, Input, Modal } from '../components/ui';

export const LLMList: React.FC = () => {
  const { token, user } = useAuth();
  const [llms, setLlms] = useState<LLM[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLLM, setEditingLLM] = useState<Partial<LLM>>({});
  
  // User specific states
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [selectedLLMName, setSelectedLLMName] = useState('');

  useEffect(() => {
    fetchLLMs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchLLMs = async () => {
    if (!token) return;
    try {
      const data = await api.request('/llms/', 'GET', null, token);
      setLlms(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту модель LLM?')) return;
    try {
      await api.request(`/llms/${id}/`, 'DELETE', null, token);
      fetchLLMs();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLLM.id) {
        await api.request(`/llms/${editingLLM.id}/`, 'PUT', editingLLM, token);
      } else {
        await api.request('/llms/', 'POST', editingLLM, token);
      }
      setIsModalOpen(false);
      fetchLLMs();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRunTests = async (id: number) => {
    try {
      await api.request(`/llms/${id}/run_tests/`, 'POST', null, token);
      alert('Тесты запущены в фоновой задаче.');
    } catch (error) {
      alert('Не удалось запустить тесты');
        console.error(error);
    }
  };

  // User logic: Get or Create Token for this LLM
  const handleGetToken = async (llm: LLM) => {
    if (!user || !token) return;
    try {
        // First check if exists
        // Since API doesn't have a direct filter endpoint in the swagger summary for LLMUser by llm+user, 
        // we'll fetch all my tokens (assuming /llm-users/ returns filtered list for regular users or we filter client side if list is small)
        // Note: For a real app, backend should filter. Assuming standard DRF behavior where user sees their own.
        
        const myLLMUsers: LLMUser[] = await api.request('/llm-users/', 'GET', null, token);
        const existing = myLLMUsers.find(lu => lu.llm === llm.id && lu.user === user.id);

        if (existing) {
            setGeneratedToken(existing.token);
        } else {
            // Create new
            const newTokenStr = `sk-proj-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
            const newEntry: Partial<LLMUser> = {
                llm: llm.id,
                user: user.id,
                token: newTokenStr
            };
            const created = await api.request('/llm-users/', 'POST', newEntry, token);
            setGeneratedToken(created.token);
        }
        setSelectedLLMName(llm.name);
        setTokenModalOpen(true);
    } catch (error) {
        console.error("Error getting token", error);
      alert("Не удалось получить токен.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Модели LLM</h1>
        {user?.is_staff && (
          <Button onClick={() => { setEditingLLM({}); setIsModalOpen(true); }}>
            Добавить модель
          </Button>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {llms.map((llm) => (
            <li key={llm.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{llm.name}</h3>
                {user?.is_staff && (
                    <p className="text-sm text-gray-500 truncate max-w-md">{llm.openai_link}</p>
                )}
              </div>
              <div className="flex space-x-2">
                {user?.is_staff ? (
                  <>
                    <Button size="sm" variant="success" onClick={() => handleRunTests(llm.id)}>
                      Запустить тесты
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => { setEditingLLM(llm); setIsModalOpen(true); }}>
                      Редактировать
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(llm.id)}>
                      Удалить
                    </Button>
                  </>
                ) : (
                    <Button size="sm" onClick={() => handleGetToken(llm)}>
                        Получить токен
                    </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Admin Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLLM.id ? 'Редактировать модель' : 'Добавить модель LLM'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Название"
            value={editingLLM.name || ''}
            onChange={(e) => setEditingLLM({ ...editingLLM, name: e.target.value })}
            required
          />
          <Input
            label="Ссылка (OpenAI-совместимый)"
            value={editingLLM.openai_link || ''}
            onChange={(e) => setEditingLLM({ ...editingLLM, openai_link: e.target.value })}
            type="url"
          />
          <Input
            label="API-токен"
            value={editingLLM.api_token || ''}
            onChange={(e) => setEditingLLM({ ...editingLLM, api_token: e.target.value })}
            type="password"
          />
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </Modal>

      {/* User Token Display Modal */}
      <Modal
        isOpen={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        title={`Подключение к ${selectedLLMName}`}
      >
         <div className="space-y-4">
          <p className="text-sm text-gray-600">Используйте следующие данные для подключения через OpenAI-совместимый клиент:</p>
            
            <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Endpoint</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                    <input readOnly value="http://127.0.0.1:8000/v1" className="flex-1 block w-full rounded-md border-gray-300 sm:text-sm bg-gray-50 border p-2"/>
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Ваш API-ключ</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                    <input readOnly value={generatedToken} className="flex-1 block w-full rounded-md border-gray-300 sm:text-sm bg-gray-50 border p-2 font-mono"/>
                    <Button variant="secondary" className="ml-2" onClick={() => navigator.clipboard.writeText(generatedToken)}>
                        Копировать
                    </Button>
                </div>
            </div>
            
             <div className="flex justify-end mt-4">
                <Button onClick={() => setTokenModalOpen(false)}>Закрыть</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};