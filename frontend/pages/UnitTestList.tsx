import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../App';
import { UnitTest } from '../types';
import { Button, Input, Modal, Select, Textarea } from '../components/ui';

export const UnitTestList: React.FC = () => {
  const { token } = useAuth();
  const [tests, setTests] = useState<UnitTest[]>([]);
  const [searchName, setSearchName] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Partial<UnitTest>>({});

  useEffect(() => {
    fetchTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchTests = async () => {
    if (!token) return;
    try {
      const data = await api.request('/unit-tests/', 'GET', null, token);
      // API may return an array or an object (e.g. { results: [...] }).
      if (Array.isArray(data)) {
        setTests(data);
      } else if (data && typeof data === 'object') {
        if (Array.isArray((data as any).results)) {
          setTests((data as any).results);
        } else {
          // Fallback: try to extract array values, or set empty
          const vals = Object.values(data).filter((v) => Array.isArray(v)).shift();
          if (Array.isArray(vals)) setTests(vals as any);
          else {
            console.warn('Unexpected unit-tests API response format, expected array or {results:[]}', data);
            setTests([]);
          }
        }
      } else {
        setTests([]);
      }
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены?')) return;
    try {
      await api.request(`/unit-tests/${id}/`, 'DELETE', null, token);
      fetchTests();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTest.id) {
        await api.request(`/unit-tests/${editingTest.id}/`, 'PUT', editingTest, token);
      } else {
        await api.request('/unit-tests/', 'POST', editingTest, token);
      }
      setIsModalOpen(false);
      fetchTests();
    } catch (error) {
      console.error(error);
    }
  };

  // Client-side filtering + pagination (hooks must be at top-level)
  const filtered = useMemo(() => {
    return tests.filter((t) => {
      const matchesName = t.name?.toLowerCase().includes(searchName.trim().toLowerCase());
      const matchesDifficulty = filterDifficulty === 'all' || t.difficulty === filterDifficulty;
      return matchesName && matchesDifficulty;
    });
  }, [tests, searchName, filterDifficulty]);

  // ensure currentPage stays in range when filters/pageSize change
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [filtered.length, pageSize]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Тесты</h1>
        <Button onClick={() => { setEditingTest({ difficulty: 'easy' }); setIsModalOpen(true); }}>
          Добавить тест
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          label="Поиск по имени"
          value={searchName}
          onChange={(e) => { setSearchName(e.target.value); setCurrentPage(1); }}
          placeholder="Имя теста..."
        />
        <Select
          label="Сложность"
          value={filterDifficulty}
          onChange={(e) => { setFilterDifficulty(e.target.value as any); setCurrentPage(1); }}
          options={[
            { value: 'all', label: 'Все' },
            { value: 'easy', label: 'Лёгкая' },
            { value: 'medium', label: 'Средняя' },
            { value: 'hard', label: 'Сложная' },
          ]}
        />
        <Select
          label="На странице"
          value={String(pageSize)}
          onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
          options={[
            { value: '5', label: '5' },
            { value: '10', label: '10' },
            { value: '20', label: '20' },
          ]}
        />
      </div>

      {/* list rendered below */}

      <div>
        <ul className="divide-y divide-gray-200 bg-white rounded-md shadow-sm">
          {paginated.map((t) => (
            <li key={t.id} className="px-6 py-4 flex items-start justify-between">
              <div className="flex-1 mr-4 min-w-0">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium text-gray-900 mr-2 truncate">{t.name}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                    ${t.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      t.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      t.difficulty === 'hard' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {t.difficulty === 'easy' ? 'Лёгкий' : t.difficulty === 'medium' ? 'Средний' : t.difficulty === 'hard' ? 'Сложный' : 'Все'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {t.prompt ? (t.prompt.length > 140 ? `${t.prompt.slice(0, 140)}...` : t.prompt) : ''}
                </p>
              </div>
              <div className="flex-shrink-0 flex space-x-2 ml-4">
                <Button size="sm" variant="secondary" onClick={() => { setEditingTest(t); setIsModalOpen(true); }}>
                  Редактировать
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(t.id)}>
                  Удалить
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Показано {(total === 0) ? 0 : ( (currentPage - 1) * pageSize + 1)}-{Math.min(currentPage * pageSize, total)} из {total}
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="secondary" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              Предыдущая
            </Button>
            <div className="px-2 text-sm">{currentPage} / {totalPages}</div>
            <Button size="sm" variant="secondary" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Следующая
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTest.id ? 'Редактировать тест' : 'Добавить тест'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Название"
            value={editingTest.name || ''}
            onChange={(e) => setEditingTest({ ...editingTest, name: e.target.value })}
            required
          />
          <Select
            label="Сложность"
            value={editingTest.difficulty || 'easy'}
            onChange={(e) => setEditingTest({ ...editingTest, difficulty: e.target.value as any })}
            options={[
                { value: 'easy', label: 'Лёгкая' },
                { value: 'medium', label: 'Средняя' },
                { value: 'hard', label: 'Сложная' },
                { value: 'all', label: 'Все' },
            ]}
          />
          <Textarea
            label="Пояснение (prompt)"
            rows={3}
            value={editingTest.prompt || ''}
            onChange={(e) => setEditingTest({ ...editingTest, prompt: e.target.value })}
            required
          />
          <Textarea
            label="Тесты (Python код)"
            rows={5}
            value={editingTest.tests || ''}
            onChange={(e) => setEditingTest({ ...editingTest, tests: e.target.value })}
            className="font-mono text-xs"
            required
          />
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};