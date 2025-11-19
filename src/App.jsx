import { useState, useEffect } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import * as Dialog from '@radix-ui/react-dialog'
import { CheckIcon, Cross2Icon, TrashIcon } from '@radix-ui/react-icons'
import './App.css'

function App() {
  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem('todos')
    return savedTodos ? JSON.parse(savedTodos) : []
  })
  const [newTodo, setNewTodo] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([
        ...todos,
        {
          id: Date.now(),
          text: newTodo,
          completed: false,
        }
      ])
      setNewTodo('')
      setDialogOpen(false)
    }
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100 p-4">
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
            <h1 className="text-3xl font-bold text-white text-center">My Todo List</h1>
            <p className="text-purple-100 text-center mt-2">Stay organized and productive</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Add Todo Button */}
            <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
              <Dialog.Trigger asChild>
                <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg">
                  + Add New Todo
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-96 max-w-[90vw] shadow-2xl">
                  <Dialog.Title className="text-2xl font-bold text-gray-800 mb-4">
                    Add New Todo
                  </Dialog.Title>
                  <Dialog.Description className="text-gray-600 mb-4">
                    Create a new task to add to your list
                  </Dialog.Description>
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter todo text..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                    autoFocus
                  />
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={addTodo}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                    >
                      Add Todo
                    </button>
                    <Dialog.Close asChild>
                      <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                        Cancel
                      </button>
                    </Dialog.Close>
                  </div>
                  <Dialog.Close asChild>
                    <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                      <Cross2Icon className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            {/* Todo List */}
            <div className="mt-6 space-y-3">
              {todos.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No todos yet. Add one to get started!</p>
                </div>
              ) : (
                todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <Checkbox.Root
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className="w-6 h-6 bg-white border-2 border-gray-300 rounded flex items-center justify-center hover:border-purple-500 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    >
                      <Checkbox.Indicator>
                        <CheckIcon className="w-4 h-4 text-purple-600" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <span
                      className={`flex-1 text-lg ${
                        todo.completed
                          ? 'text-gray-400 line-through'
                          : 'text-gray-700'
                      }`}
                    >
                      {todo.text}
                    </span>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Delete todo"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Stats */}
            {todos.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total: {todos.length}</span>
                  <span>Completed: {todos.filter(t => t.completed).length}</span>
                  <span>Remaining: {todos.filter(t => !t.completed).length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
