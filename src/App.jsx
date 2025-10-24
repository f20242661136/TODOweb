import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [newPriority, setNewPriority] = useState('medium');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();

    // Set up real-time subscription ONLY for public tasks
    const subscription = supabase
      .channel('public-tasks')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: 'user_id=is.null'  // ONLY listen to public tasks
        },
        (payload) => {
          console.log('Real-time update received for public task:', payload);
          fetchTasks();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .is('user_id', null)  // Only fetch public tasks
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        alert('Error loading tasks: ' + error.message);
      } else {
        setTasks(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Unexpected error loading tasks');
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (newTitle.trim() === '') {
      alert('Please enter a task title');
      return;
    }

    const newTask = {
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      completed: false,
      user_id: null,  // Public task
      created_at: new Date().toISOString()  // Temporary, will be overridden by DB
    };

    // Optimistically update UI
    setTasks(prevTasks => [newTask, ...prevTasks]);
    setNewTitle('');
    setNewCategory('Personal');
    setNewPriority('medium');

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select();  // Return the inserted data

      if (error) {
        console.error('Error adding task:', error);
        alert('Error adding task: ' + error.message);
        // Revert optimistic update on error
        setTasks(prevTasks => prevTasks.filter(task => task !== newTask));
        setNewTitle(newTask.title);
        setNewCategory(newTask.category);
        setNewPriority(newTask.priority);
      } else {
        // Update with actual data from DB
        setTasks(prevTasks => prevTasks.map(task =>
          task === newTask ? data[0] : task
        ));
        console.log('Task added successfully:', data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Unexpected error adding task');
      // Revert optimistic update on error
      setTasks(prevTasks => prevTasks.filter(task => task !== newTask));
      setNewTitle(newTask.title);
      setNewCategory(newTask.category);
      setNewPriority(newTask.priority);
    }
  };

  const toggleCompleted = async (id, completed) => {
    // Optimistically update UI
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === id ? { ...task, completed: !completed } : task
    ));

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !completed })
        .eq('id', id)
        .is('user_id', null);  // Ensure we only update public tasks

      if (error) {
        console.error('Error updating task:', error);
        alert('Error updating task: ' + error.message);
        // Revert optimistic update on error
        setTasks(prevTasks => prevTasks.map(task =>
          task.id === id ? { ...task, completed } : task
        ));
      } else {
        console.log('Task updated successfully');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Unexpected error updating task');
      // Revert optimistic update on error
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === id ? { ...task, completed } : task
      ));
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    // Optimistically update UI
    const taskToDelete = tasks.find(task => task.id === id);
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .is('user_id', null);  // Ensure we only delete public tasks

      if (error) {
        console.error('Error deleting task:', error);
        alert('Error deleting task: ' + error.message);
        // Revert optimistic update on error
        setTasks(prevTasks => [...prevTasks, taskToDelete]);
      } else {
        console.log('Task deleted successfully');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Unexpected error deleting task');
      // Revert optimistic update on error
      setTasks(prevTasks => [...prevTasks, taskToDelete]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      addTask();
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ffcccc';
      case 'medium': return '#ffffcc';
      case 'low': return '#ccffcc';
      default: return '#fff';
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>My Personal Task Manager</h1>

      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter task title"
          disabled={loading}
          style={{
            flex: '1 1 200px',
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            opacity: loading ? 0.6 : 1
          }}
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          disabled={loading}
          style={{
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            opacity: loading ? 0.6 : 1
          }}
        >
          <option value="Personal">Personal</option>
          <option value="Work">Work</option>
          <option value="Other">Other</option>
        </select>
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          disabled={loading}
          style={{
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            opacity: loading ? 0.6 : 1
          }}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          onClick={addTask}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: loading ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Adding...' : 'Add Task'}
        </button>
      </div>

      {loading && tasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading tasks...</div>
      )}

      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {tasks.map((task) => (
          <li
            key={task.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginBottom: '10px',
              backgroundColor: task.completed ? '#f0f0f0' : getPriorityColor(task.priority),
              opacity: loading ? 0.6 : 1
            }}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleCompleted(task.id, task.completed)}
              disabled={loading}
              style={{ marginRight: '10px' }}
            />
            <div style={{ flexGrow: 1 }}>
              <span
                style={{
                  display: 'block',
                  fontWeight: 'bold',
                  textDecoration: task.completed ? 'line-through' : 'none',
                  color: task.completed ? '#888' : '#333'
                }}
              >
                {task.title}
              </span>
              <span style={{ fontSize: '14px', color: '#666' }}>
                Category: {task.category} | Priority: {task.priority}
              </span>
            </div>
            <button
              onClick={() => deleteTask(task.id)}
              disabled={loading}
              style={{
                padding: '5px 10px',
                fontSize: '14px',
                backgroundColor: loading ? '#cccccc' : '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginLeft: '10px'
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {tasks.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          No tasks yet. Add your first task above!
        </div>
      )}
    </div>
  );
}

export default App;