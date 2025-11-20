
import React, { useState, KeyboardEvent } from 'react';
import { Task } from '../types';

interface TodoWidgetProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  isDark: boolean;
}

const TodoWidget: React.FC<TodoWidgetProps> = ({ tasks, setTasks, isDark }) => {
  const [inputValue, setInputValue] = useState('');

  const addTask = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        text: inputValue.trim(),
        completed: false,
      };
      setTasks([...tasks, newTask]);
      setInputValue('');
    }
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const bgClass = isDark ? 'bg-[#1e1e1e]/60 border-white/10' : 'bg-white/60 border-black/5';
  const inputBg = isDark ? 'bg-black/20 text-white' : 'bg-gray-100 text-gray-800';

  return (
    <div className={`${bgClass} backdrop-blur-xl rounded-[2.5rem] border p-8 md:p-10 flex flex-col h-[650px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-transform duration-300 hover:scale-[1.005]`}>
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-500/10">
        <span className="text-2xl font-bold flex items-center gap-3 text-purple-400">
          <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-xl"><i className="fas fa-check-square"></i></span>
          المهام
        </span>
        <span className="text-xs font-mono font-bold opacity-50 bg-gray-500/10 px-3 py-1.5 rounded-lg tracking-wider">{tasks.filter(t => !t.completed).length} PENDING</span>
      </div>
      
      <div className="relative mb-6 group">
        <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={addTask}
            className={`w-full p-5 pl-12 rounded-2xl border-none ${inputBg} placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-inner text-lg`}
            placeholder="أضف مهمة جديدة..."
        />
        <i className="fas fa-plus absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors text-lg"></i>
      </div>
      
      <ul className="list-none p-0 m-0 overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-3">
        {tasks.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
                <i className="fas fa-clipboard-list text-6xl mb-4"></i>
                <p className="text-lg">كل شيء نظيف</p>
            </div>
        )}
        {tasks.map(task => (
          <li 
            key={task.id} 
            className={`group flex items-center p-4 rounded-2xl transition-all duration-200 animate-fade-in border border-transparent ${isDark ? 'hover:bg-white/5 bg-white/5' : 'hover:bg-black/5 bg-white'} ${task.completed ? 'opacity-50 grayscale' : ''}`}
          >
            <div className="relative flex items-center justify-center w-6 h-6">
                <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                className="peer appearance-none w-6 h-6 border-2 border-gray-500 rounded-lg checked:bg-purple-500 checked:border-purple-500 cursor-pointer transition-colors"
                />
                <i className="fas fa-check text-white text-xs absolute opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
            </div>
            
            <span className={`flex-1 mr-4 text-lg ${task.completed ? 'line-through' : ''} ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {task.text}
            </span>
            
            <button 
              className="w-10 h-10 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
              onClick={() => deleteTask(task.id)}
            >
                <i className="fas fa-times"></i>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoWidget;
