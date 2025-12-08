import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../App';
import { LLM, LLMResult } from '../types';
import { Select } from '../components/ui';

export const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const DIFFICULTY_LABELS: Record<string, string> = { all: 'Все', easy: 'Лёгкая', medium: 'Средняя', hard: 'Сложная' };
  const [results, setResults] = useState<LLMResult[]>([]);
  const [llms, setLlms] = useState<LLM[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) return;
        const [resData, llmData] = await Promise.all([
          api.request('/llm-results/', 'GET', null, token),
          api.request('/llms/', 'GET', null, token)
        ]);
        setResults(resData);
        setLlms(llmData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const chartData = useMemo(() => {
    if (!llms.length || !results.length) return [];

    // Filter results by difficulty
    const filteredResults = results.filter(r => r.difficulty === difficultyFilter);

    // Group by LLM and get the latest result for simplicity, or aggregate
    // For this benchmark, we usually want to compare models. 
    // Let's map LLM Name to their result.

    return llms.map(llm => {
      const llmRes = filteredResults
        .filter(r => r.llm === llm.id)
        .sort((a, b) => (new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())); // get latest

      return {
        name: llm.name,
        score: llmRes.length > 0 ? llmRes[0].result : 0,
      };
    }).filter(item => item.score > 0 || true); // keep all to show missing data as 0

  }, [results, llms, difficultyFilter]);

  if (loading) return <div>Загрузка статистики...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Панель бенчмарков</h1>
        <div className="w-48">
          <Select
            label="Сложность"
            options={[
              { value: 'all', label: 'Все' },
              { value: 'easy', label: 'Лёгкая' },
              { value: 'medium', label: 'Средняя' },
              { value: 'hard', label: 'Сложняя' },
            ]}
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow h-[500px]">
        <h3 className="text-lg font-medium mb-6">Производительность моделей (Pass@1)</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                label={{ value: 'Процент успеха (%)', angle: -90, position: 'left', dx: -10 }}
              />
              <Tooltip />
              <Legend verticalAlign="top" />
              <Bar dataKey="score" name="Процент прохождения">
                {chartData.map((entry, index) => {
                  const colors = ['#4F46E5', '#EF4444', '#10B981', '#F59E0B', '#06B6D4', '#8B5CF6'];
                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            Данные отсутствуют
          </div>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Последние прогоны</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {results.slice(0, 5).map((result) => {
            const llmName = llms.find(l => l.id === result.llm)?.name || 'Неизвестная модель';
            return (
              <li key={result.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-600 truncate">{llmName}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${result.result >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {result.result.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Сложность: {DIFFICULTY_LABELS[result.difficulty] || result.difficulty}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  );
};