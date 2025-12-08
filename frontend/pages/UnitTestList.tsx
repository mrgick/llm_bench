import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../App';
import { UnitTest } from '../types';
import { Button, Input, Modal, Select, Textarea } from '../components/ui';

export const UnitTestList: React.FC = () => {
  const { token } = useAuth();
  const [tests, setTests] = useState<UnitTest[]>([]);
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
      setTests(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Unit Tests</h1>
        <Button onClick={() => { setEditingTest({ difficulty: 'easy' }); setIsModalOpen(true); }}>
          Add Test
        </Button>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {tests.map((t) => (
            <li key={t.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex-1 mr-4">
                <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900 mr-2">{t.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                        ${t.difficulty === 'easy' ? 'bg-green-100 text-green-800' : 
                          t.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                          t.difficulty === 'hard' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {t.difficulty}
                    </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{t.prompt}</p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="secondary" onClick={() => { setEditingTest(t); setIsModalOpen(true); }}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(t.id)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTest.id ? 'Edit Test' : 'Add Test'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Name"
            value={editingTest.name || ''}
            onChange={(e) => setEditingTest({ ...editingTest, name: e.target.value })}
            required
          />
          <Select
            label="Difficulty"
            value={editingTest.difficulty || 'easy'}
            onChange={(e) => setEditingTest({ ...editingTest, difficulty: e.target.value as any })}
            options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
                { value: 'all', label: 'All' },
            ]}
          />
          <Textarea
            label="Prompt"
            rows={3}
            value={editingTest.prompt || ''}
            onChange={(e) => setEditingTest({ ...editingTest, prompt: e.target.value })}
            required
          />
          <Textarea
            label="Tests (Python Code)"
            rows={5}
            value={editingTest.tests || ''}
            onChange={(e) => setEditingTest({ ...editingTest, tests: e.target.value })}
            className="font-mono text-xs"
            required
          />
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};