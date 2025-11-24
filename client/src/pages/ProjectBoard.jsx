import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import useTaskStore from '../store/taskStore';
import useProjectStore from '../store/projectStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ArrowLeft, Paperclip, FileText, Activity as ActivityIcon, Users } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import InviteMemberDialog from '../components/InviteMemberDialog';
import InvitationsList from '../components/InvitationsList';
import ActivityFeed from '../components/ActivityFeed';
import TaskFilters from '../components/TaskFilters';
import BulkActions from '../components/BulkActions';

const ProjectBoard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        tasks,
        selectedTasks,
        fetchTasks,
        createTask,
        updateTask,
        addTask,
        updateTaskState,
        removeTask,
        toggleTaskSelection,
        clearSelection,
        isLoading
    } = useTaskStore();
    const { currentProject, getProject } = useProjectStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [filters, setFilters] = useState({});
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        status: 'Todo',
        priority: 'Medium',
        projectId: id
    });

    useEffect(() => {
        getProject(id);
        fetchTasks(id);

        const socket = io('http://localhost:5000');

        socket.emit('joinProject', id);

        socket.on('taskCreated', (task) => {
            addTask(task);
        });

        socket.on('taskUpdated', (task) => {
            updateTaskState(task);
            if (selectedTask && selectedTask._id === task._id) {
                setSelectedTask(task);
            }
        });

        socket.on('taskDeleted', (taskId) => {
            removeTask(taskId);
            if (selectedTask && selectedTask._id === taskId) {
                setSelectedTask(null);
            }
        });

        return () => {
            socket.emit('leaveProject', id);
            socket.disconnect();
        };
    }, [id]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        await createTask({ ...newTask, projectId: id });
        setIsDialogOpen(false);
        setNewTask({
            title: '',
            description: '',
            status: 'Todo',
            priority: 'Medium',
            projectId: id
        });
    };

    const handleStatusChange = async (taskId, newStatus) => {
        await updateTask(taskId, { status: newStatus });
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        fetchTasks(id, newFilters);
    };

    const handleBulkActionComplete = () => {
        clearSelection();
        fetchTasks(id, filters);
    };

    const handleTaskSelect = (e, taskId) => {
        e.stopPropagation();
        toggleTaskSelection(taskId);
    };

    const columns = ['Todo', 'In Progress', 'Review', 'Completed'];

    if (isLoading && !currentProject) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Main Content */}
            <div className="flex-1 p-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => navigate('/')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <h1 className="text-2xl font-bold">{currentProject?.name}</h1>
                        </div>
                        <div className="flex gap-2">
                            <InviteMemberDialog projectId={id} />
                            <Button variant="outline" size="sm" onClick={() => setShowSidebar(!showSidebar)}>
                                {showSidebar ? <ActivityIcon className="h-4 w-4 mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                                {showSidebar ? 'Activity' : 'Info'}
                            </Button>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Task
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Create Task</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateTask}>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="title">Title</Label>
                                                <Input
                                                    id="title"
                                                    value={newTask.title}
                                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="description">Description</Label>
                                                <Textarea
                                                    id="description"
                                                    value={newTask.description}
                                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="status">Status</Label>
                                                    <Select
                                                        value={newTask.status}
                                                        onValueChange={(value) => setNewTask({ ...newTask, status: value })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {columns.map(col => (
                                                                <SelectItem key={col} value={col}>{col}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="priority">Priority</Label>
                                                    <Select
                                                        value={newTask.priority}
                                                        onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select priority" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Low">Low</SelectItem>
                                                            <SelectItem value="Medium">Medium</SelectItem>
                                                            <SelectItem value="High">High</SelectItem>
                                                            <SelectItem value="Critical">Critical</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit">Create Task</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Filters and Bulk Actions */}
                    <div className="mb-4 space-y-3">
                        <TaskFilters onFilterChange={handleFilterChange} />
                        <BulkActions selectedTasks={selectedTasks} onActionComplete={handleBulkActionComplete} />
                    </div>

                    {/* Kanban Board */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-280px)] overflow-x-auto">
                        {columns.map((column) => (
                            <div key={column} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex flex-col gap-4">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{column}</h3>
                                <div className="flex-1 overflow-y-auto space-y-4">
                                    {tasks
                                        .filter((task) => task.status === column)
                                        .map((task) => (
                                            <Card
                                                key={task._id}
                                                className={`cursor-pointer hover:shadow-md transition-shadow ${selectedTasks.includes(task._id) ? 'ring-2 ring-blue-500' : ''
                                                    }`}
                                                onClick={() => setSelectedTask(task)}
                                            >
                                                <CardHeader className="p-4">
                                                    <div className="flex items-start gap-2">
                                                        <Checkbox
                                                            checked={selectedTasks.includes(task._id)}
                                                            onCheckedChange={(e) => handleTaskSelect(e, task._id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="mt-1"
                                                        />
                                                        <div className="flex-1">
                                                            <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                                                            <div className="flex justify-between items-center mt-2">
                                                                <span className={`text-xs px-2 py-1 rounded-full ${task.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                                                                        task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                                                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                                'bg-green-100 text-green-800'
                                                                    }`}>
                                                                    {task.priority}
                                                                </span>
                                                                {task.attachments?.length > 0 && (
                                                                    <Paperclip className="h-3 w-3 text-gray-400" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                            </Card>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            {showSidebar && (
                <div className="w-80 bg-white dark:bg-gray-800 border-l p-4 overflow-y-auto">
                    <div className="space-y-4">
                        <ActivityFeed projectId={id} />
                        <InvitationsList projectId={id} />
                    </div>
                </div>
            )}

            {/* Task Details Dialog */}
            <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedTask?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label className="font-semibold">Description</Label>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {selectedTask?.description || 'No description provided.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="font-semibold">Status</Label>
                                <div className="mt-1">
                                    <Select
                                        value={selectedTask?.status}
                                        onValueChange={(value) => handleStatusChange(selectedTask._id, value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {columns.map(col => (
                                                <SelectItem key={col} value={col}>{col}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label className="font-semibold">Priority</Label>
                                <p className="mt-2 text-sm">{selectedTask?.priority}</p>
                            </div>
                        </div>

                        <div>
                            <Label className="font-semibold">Attachments</Label>
                            <div className="mt-2 space-y-2">
                                {selectedTask?.attachments?.map((file, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 border rounded bg-gray-50 dark:bg-gray-800">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline truncate flex-1"
                                        >
                                            {file.name}
                                        </a>
                                    </div>
                                ))}
                                {(!selectedTask?.attachments || selectedTask.attachments.length === 0) && (
                                    <p className="text-sm text-gray-500 italic">No attachments yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <FileUpload taskId={selectedTask?._id} />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProjectBoard;
