import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../App';
import { User } from '../types';
import { Button, Input, Modal } from '../components/ui';

export const UserList: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const data = await api.request('/users/', 'GET', null, token);
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.request(`/users/${id}/`, 'DELETE', null, token);
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser.id) {
        await api.request(`/users/${editingUser.id}/`, 'PUT', editingUser, token);
      } else {
        await api.request('/users/', 'POST', editingUser, token);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Button onClick={() => { setEditingUser({}); setIsModalOpen(true); }}>
          Create User
        </Button>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {users.map((u) => (
            <li key={u.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{u.username}</h3>
                <p className="text-sm text-gray-500">{u.email}</p>
                {u.is_staff && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Admin</span>}
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="secondary" onClick={() => { setEditingUser(u); setIsModalOpen(true); }}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(u.id)}>
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
        title={editingUser.id ? 'Edit User' : 'Create User'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Username"
            value={editingUser.username || ''}
            onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={editingUser.email || ''}
            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            placeholder={editingUser.id ? "Leave blank to keep current" : "Required"}
            value={editingUser.password || ''}
            onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
            required={!editingUser.id}
          />
           <div className="flex items-center">
            <input
              id="is_staff"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={editingUser.is_staff || false}
              onChange={(e) => setEditingUser({ ...editingUser, is_staff: e.target.checked })}
            />
            <label htmlFor="is_staff" className="ml-2 block text-sm text-gray-900">
              Is Admin
            </label>
          </div>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};