import { useState, useEffect, useRef } from 'react'
import { Task } from '../models/Activity'
import { TaskApiService } from '../services/TaskApiService'

interface TasksListProps {
  tasks: Task[]
  activityId: number | undefined
  userId?: number
  backgroundColor: string
  textColor?: 'black' | 'white'
  onUpdate: (tasks: Task[]) => void
  onSave: (activityId: number | undefined, tasks: Task[]) => void
  isOpen: boolean
  maxDepth?: number // Profondeur maximale des sous-tâches (défaut: 10)
}

interface TaskItemProps {
  task: Task
  depth: number
  index: number
  path: number[] // Chemin dans l'arbre pour identifier la tâche
  backgroundColor: string
  textColor: 'black' | 'white'
  onUpdate: (updatedTask: Task) => void
  onDelete: () => void
  onReorder: (fromPath: number[], toPath: number[], toIndex: number) => void
  maxDepth: number
  parentTasks: Task[] // Liste des tâches parentes pour le drag and drop
}

function TaskItem({
  task,
  depth,
  index,
  path,
  backgroundColor,
  textColor,
  onUpdate,
  onDelete,
  onReorder,
  maxDepth,
  parentTasks,
}: TaskItemProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)

  const borderColor = textColor === 'white' ? 'rgba(255,255,255,0.3)' : '#000000'
  const subtasks = task.subtasks || []

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus()
    }
  }, [isEditingDescription])

  const handleCheckboxChange = (checked: boolean) => {
    const updatedTask: Task = {
      ...task,
      isChecked: checked,
      isDeleted: checked ? true : false,
    }
    
    // Si on décoche, remettre isDeleted à false
    if (!checked) {
      updatedTask.isDeleted = false
    }
    
    onUpdate(updatedTask)
  }

  const handleTitleChange = (newTitle: string) => {
    const updatedTask: Task = {
      ...task,
      title: newTitle,
    }
    onUpdate(updatedTask)
  }

  const handleDescriptionChange = (newDescription: string) => {
    const updatedTask: Task = {
      ...task,
      description: newDescription,
    }
    onUpdate(updatedTask)
  }

  const handleAddSubtask = () => {
    const newSubtask: Task = {
      title: '',
      description: '',
      isChecked: false,
      isDeleted: false,
      subtasks: [],
    }
    const updatedTask: Task = {
      ...task,
      subtasks: [...subtasks, newSubtask],
    }
    setIsExpanded(true)
    onUpdate(updatedTask)
  }

  const handleSubtaskUpdate = (subtaskIndex: number, updatedSubtask: Task) => {
    const updatedSubtasks = [...subtasks]
    updatedSubtasks[subtaskIndex] = updatedSubtask
    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks,
    }
    onUpdate(updatedTask)
  }

  const handleSubtaskDelete = (subtaskIndex: number) => {
    const updatedSubtasks = subtasks.filter((_, i) => i !== subtaskIndex)
    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks,
    }
    onUpdate(updatedTask)
  }

  const handleSubtaskReorder = (
    fromPath: number[],
    toPath: number[],
    toIndex: number
  ) => {
    // Si le drag vient d'une sous-tâche de cette tâche
    if (fromPath.length === path.length + 1 && fromPath[path.length] !== undefined) {
      const fromIndex = fromPath[path.length]
      const updatedSubtasks = [...subtasks]
      const [draggedSubtask] = updatedSubtasks.splice(fromIndex, 1)
      
      if (toPath.length === path.length + 1) {
        // Réorganiser dans les mêmes sous-tâches
        const toSubtaskIndex = toPath[path.length]
        updatedSubtasks.splice(toSubtaskIndex, 0, draggedSubtask)
      } else {
        // Ajouter à la fin
        updatedSubtasks.push(draggedSubtask)
      }
      
      const updatedTask: Task = {
        ...task,
        subtasks: updatedSubtasks,
      }
      onUpdate(updatedTask)
    } else {
      // Déléguer au parent
      onReorder(fromPath, toPath, toIndex)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      setDragOverIndex(targetIndex)
    }
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    onReorder([...path, draggedIndex], [...path, dropIndex], dropIndex)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Séparer les tâches complétées et non complétées
  const sortedSubtasks = [...subtasks].sort((a, b) => {
    const aCompleted = a.isChecked || a.isDeleted
    const bCompleted = b.isChecked || b.isDeleted
    if (aCompleted && !bCompleted) return 1
    if (!aCompleted && bCompleted) return -1
    return 0
  })

  const isCompleted = task.isChecked || task.isDeleted

  return (
    <div
      className="task-item"
      style={{
        marginLeft: depth > 0 ? `${depth * 24}px` : '0',
        borderLeft: depth > 0 ? `2px solid ${borderColor}` : 'none',
        paddingLeft: depth > 0 ? '8px' : '0',
      }}
    >
      <div
        className={`flex items-start gap-2 p-2 rounded transition-colors ${
          isHovered ? 'bg-opacity-20' : ''
        } ${draggedIndex === index ? 'opacity-50' : ''}`}
        style={{
          backgroundColor: isHovered
            ? textColor === 'white'
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(0,0,0,0.05)'
            : 'transparent',
          borderBottom:
            dragOverIndex === index && draggedIndex !== null && draggedIndex < index
              ? `2px solid ${borderColor}`
              : 'none',
          borderTop:
            dragOverIndex === index && draggedIndex !== null && draggedIndex > index
              ? `2px solid ${borderColor}`
              : 'none',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        draggable={true}
        onDragStart={handleDragStart}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
      >
        {/* Drag handle (6 petits points) */}
        <div
          ref={dragHandleRef}
          className="cursor-move flex items-center justify-center w-6 h-6 flex-shrink-0"
          style={{ color: borderColor }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="6" cy="6" r="1.5" />
            <circle cx="12" cy="6" r="1.5" />
            <circle cx="18" cy="6" r="1.5" />
            <circle cx="6" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="18" cy="12" r="1.5" />
            <circle cx="6" cy="18" r="1.5" />
            <circle cx="12" cy="18" r="1.5" />
            <circle cx="18" cy="18" r="1.5" />
          </svg>
        </div>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.isChecked || false}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
          className="mt-1 flex-shrink-0"
          style={{ accentColor: borderColor }}
        />

        {/* Contenu de la tâche */}
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={task.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                } else if (e.key === 'Escape') {
                  setIsEditingTitle(false)
                }
              }}
              className={`w-full border outline-none focus:ring-2 rounded px-2 py-1 bg-transparent ${
                textColor === 'white' ? 'text-white' : 'text-black'
              }`}
              style={{
                '--tw-ring-color': textColor === 'white' ? '#FFFFFF' : '#000000',
                borderColor: borderColor,
                textDecoration: isCompleted ? 'line-through' : 'none',
              } as React.CSSProperties}
            />
          ) : (
            <div
              className={`cursor-text ${isCompleted ? 'line-through opacity-60' : ''} ${
                textColor === 'white' ? 'text-white' : 'text-black'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                setIsEditingTitle(true)
              }}
            >
              {task.title || 'Nouvelle tâche'}
            </div>
          )}

          {/* Description */}
          {isEditingDescription ? (
            <textarea
              ref={descriptionInputRef}
              value={task.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              onBlur={() => setIsEditingDescription(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsEditingDescription(false)
                }
              }}
              className={`w-full mt-1 border outline-none focus:ring-2 rounded px-2 py-1 bg-transparent resize-none ${
                textColor === 'white' ? 'text-gray-300' : 'text-gray-600'
              }`}
              style={{
                '--tw-ring-color': textColor === 'white' ? '#FFFFFF' : '#000000',
                borderColor: borderColor,
              } as React.CSSProperties}
              rows={2}
            />
          ) : (
            task.description && (
              <div
                className={`text-sm mt-1 cursor-text ${
                  textColor === 'white' ? 'text-gray-300' : 'text-gray-600'
                } ${isCompleted ? 'line-through opacity-60' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingDescription(true)
                }}
              >
                {task.description}
              </div>
            )
          )}
          
          {/* Afficher la description au hover si elle existe */}
          {!isEditingDescription && !task.description && isHovered && (
            <div
              className={`text-xs mt-1 cursor-text italic ${
                textColor === 'white' ? 'text-gray-400' : 'text-gray-500'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                setIsEditingDescription(true)
              }}
            >
              Cliquez pour ajouter une description
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            {depth < maxDepth && (
              <button
                onClick={handleAddSubtask}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  textColor === 'white' ? 'text-gray-300 hover:bg-white hover:bg-opacity-10' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                + Sous-tâche
              </button>
            )}
            <button
              onClick={onDelete}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                textColor === 'white' ? 'text-red-300 hover:bg-white hover:bg-opacity-10' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Sous-tâches */}
      {isExpanded && depth < maxDepth && sortedSubtasks.length > 0 && (
        <div className="subtasks-container">
          {sortedSubtasks.map((subtask) => {
            const originalIndex = subtasks.indexOf(subtask)
            return (
              <TaskItem
                key={subtask.id || `${path.join('-')}-${originalIndex}`}
                task={subtask}
                depth={depth + 1}
                index={originalIndex}
                path={[...path, originalIndex]}
                backgroundColor={backgroundColor}
                textColor={textColor}
                onUpdate={(updatedSubtask) =>
                  handleSubtaskUpdate(originalIndex, updatedSubtask)
                }
                onDelete={() => handleSubtaskDelete(originalIndex)}
                onReorder={handleSubtaskReorder}
                maxDepth={maxDepth}
                parentTasks={parentTasks}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TasksList({
  tasks,
  activityId,
  userId = 1,
  backgroundColor,
  textColor = 'black',
  onUpdate,
  onSave,
  isOpen,
  maxDepth = 10,
}: TasksListProps) {
  const [isTasksOpen, setIsTasksOpen] = useState(true)
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)

  const borderColor = textColor === 'white' ? 'rgba(255,255,255,0.3)' : '#000000'

  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks, isOpen])

  useEffect(() => {
    if (!isOpen) {
      setIsTasksOpen(true)
    }
  }, [isOpen])

  const handleTaskUpdate = (taskIndex: number, updatedTask: Task) => {
    const updatedTasks = [...localTasks]
    updatedTasks[taskIndex] = updatedTask
    setLocalTasks(updatedTasks)
    onUpdate(updatedTasks)
    
    if (activityId && updatedTask.id) {
      // Mettre à jour la tâche via API
      TaskApiService.updateTask(userId, activityId, updatedTask.id, updatedTask)
      onSave(activityId, updatedTasks)
    } else {
      // Si pas d'ID, c'est une nouvelle tâche, on fait un batch update
      if (activityId) {
        TaskApiService.updateAllTasks(userId, activityId, updatedTasks)
        onSave(activityId, updatedTasks)
      }
    }
  }

  const handleTaskDelete = (taskIndex: number) => {
    const taskToDelete = localTasks[taskIndex]
    const updatedTasks = localTasks.filter((_, i) => i !== taskIndex)
    setLocalTasks(updatedTasks)
    onUpdate(updatedTasks)
    
    if (activityId) {
      if (taskToDelete.id) {
        // Supprimer via API
        TaskApiService.deleteTask(userId, activityId, taskToDelete.id)
      }
      // Mettre à jour toutes les tâches
      TaskApiService.updateAllTasks(userId, activityId, updatedTasks)
      onSave(activityId, updatedTasks)
    }
  }

  const handleTaskReorder = (
    fromPath: number[],
    toPath: number[],
    toIndex: number
  ) => {
    if (fromPath.length === 1 && toPath.length === 1) {
      // Réorganiser au niveau racine
      const fromIndex = fromPath[0]
      const updatedTasks = [...localTasks]
      const [draggedTask] = updatedTasks.splice(fromIndex, 1)
      updatedTasks.splice(toIndex, 0, draggedTask)
      setLocalTasks(updatedTasks)
      onUpdate(updatedTasks)
      
      if (activityId) {
        // Réorganiser via API
        const taskIds = updatedTasks.map(t => t.id).filter((id): id is number => id !== undefined)
        if (taskIds.length > 0) {
          TaskApiService.reorderTasks(userId, activityId, taskIds)
        }
        TaskApiService.updateAllTasks(userId, activityId, updatedTasks)
        onSave(activityId, updatedTasks)
      }
    }
  }

  const handleAddTask = () => {
    const newTask: Task = {
      title: '',
      description: '',
      isChecked: false,
      isDeleted: false,
      subtasks: [],
    }
    const updatedTasks = [...localTasks, newTask]
    setLocalTasks(updatedTasks)
    onUpdate(updatedTasks)
    
    if (activityId) {
      // Créer via API (l'ID sera généré côté serveur)
      TaskApiService.createTask(userId, activityId, newTask)
      TaskApiService.updateAllTasks(userId, activityId, updatedTasks)
      onSave(activityId, updatedTasks)
    }
  }

  // Séparer les tâches complétées et non complétées
  const sortedTasks = [...localTasks].sort((a, b) => {
    const aCompleted = a.isChecked || a.isDeleted
    const bCompleted = b.isChecked || b.isDeleted
    if (aCompleted && !bCompleted) return 1
    if (!aCompleted && bCompleted) return -1
    return 0
  })

  return (
    <div
      className="border-2 flex flex-col rounded-2xl"
      style={{
        height: '40%',
        maxHeight: '40vh',
        borderColor: borderColor,
      }}
    >
      <div
        className="w-full flex items-center justify-between hover:bg-gray-50 transition-colors sticky top-0 z-10"
        style={{ backgroundColor: backgroundColor }}
      >
        <button
          onClick={() => setIsTasksOpen(!isTasksOpen)}
          className="flex-1 cursor-pointer flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 cursor-pointer transition-transform ${
              textColor === 'white' ? 'text-white' : 'text-black'
            } ${isTasksOpen ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span
            className={`font-medium cursor-pointer ${
              textColor === 'white' ? 'text-white' : 'text-black'
            }`}
          >
            Tâches ({localTasks?.length || 0})
          </span>
        </button>
        <button
          onClick={handleAddTask}
          className="p-1 cursor-pointer [&_*]:cursor-pointer hover:bg-gray-100 rounded-xl transition-colors mr-2"
          aria-label="Ajouter une tâche"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 ${textColor === 'white' ? 'text-white' : 'text-black'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {isTasksOpen && (
        <div
          className="min-h-40 border-t flex-1 overflow-y-auto overflow-x-auto"
          style={{ borderColor: borderColor }}
        >
          <div className="p-2" style={{ minWidth: 'max-content' }}>
            {sortedTasks.length > 0 ? (
              <div className="space-y-1">
                {sortedTasks.map((task) => {
                  const originalIndex = localTasks.indexOf(task)
                  return (
                    <TaskItem
                      key={task.id || `task-${originalIndex}`}
                      task={task}
                      depth={0}
                      index={originalIndex}
                      path={[originalIndex]}
                      backgroundColor={backgroundColor}
                      textColor={textColor}
                      onUpdate={(updatedTask) =>
                        handleTaskUpdate(originalIndex, updatedTask)
                      }
                      onDelete={() => handleTaskDelete(originalIndex)}
                      onReorder={handleTaskReorder}
                      maxDepth={maxDepth}
                      parentTasks={localTasks}
                    />
                  )
                })}
              </div>
            ) : (
              <p
                className={`italic text-sm ${
                  textColor === 'white' ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Aucune tâche
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

