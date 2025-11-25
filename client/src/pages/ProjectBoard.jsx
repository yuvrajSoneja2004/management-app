import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import useTaskStore from '../store/taskStore';
import useProjectStore from '../store/projectStore';
import useAuth from '../store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ArrowLeft, Paperclip, FileText, Activity as ActivityIcon, Users, Loader2, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FileUpload from '../components/FileUpload';
import InviteMemberDialog from '../components/InviteMemberDialog';
import InvitationsList from '../components/InvitationsList';
import ActivityFeed from '../components/ActivityFeed';
import TaskFilters from '../components/TaskFilters';
import BulkActions from '../components/BulkActions';
import { toast } from 'sonner';

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
    const { currentProject, getProject, userRole } = useProjectStore();
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showMyTasks, setShowMyTasks] = useState(false);
    const [filters, setFilters] = useState({});
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        status: 'Todo',
        priority: 'Medium',
        projectId: id,
        assignees: [],
        dueDate: ''
    });

    useEffect(() => {
        getProject(id);
        fetchTasks(id);

        const socket = io('http://localhost:5000', {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('✅ Socket connected');
            socket.emit('joinProject', id);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
            socket.emit('joinProject', id);
            fetchTasks(id);
        });

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

    const isViewer = userRole?.toLowerCase() === 'viewer';

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (isViewer) {
            toast.error("Permission Denied", { description: "Viewers cannot create tasks." });
            return;
        }
        setIsCreatingTask(true);
        try {
            await createTask({ ...newTask, projectId: id });
            setIsDialogOpen(false);
            setNewTask({
                title: '',
                description: '',
                status: 'Todo',
                priority: 'Medium',
                projectId: id,
                assignees: [],
                dueDate: ''
            });
            toast.success("Task created successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create task");
        } finally {
            setIsCreatingTask(false);
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        if (isViewer) {
            toast.error("Permission Denied", { description: "Viewers cannot update task status." });
            return;
        }
        await updateTask(taskId, { status: newStatus });
        toast.success("Task status updated");
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        fetchTasks(id, {
            ...newFilters,
            assignee: showMyTasks ? user?._id : newFilters.assignee
        });
    };

    const handleMyTasksToggle = () => {
        const newShowMyTasks = !showMyTasks;
        setShowMyTasks(newShowMyTasks);
        fetchTasks(id, {
            ...filters,
            assignee: newShowMyTasks ? user?._id : filters.assignee
        });
    };

    const handleBulkActionComplete = () => {
        clearSelection();
        fetchTasks(id, filters);
    };

    const handleTaskSelect = (checked, taskId) => {
        toggleTaskSelection(taskId);
    };

    const columns = ['Todo', 'In Progress', 'Review', 'Completed'];

    if (isLoading && !currentProject) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Skeleton className="h-8 sm:h-10 w-16 sm:w-20" />
                            <Skeleton className="h-6 sm:h-8 w-40 sm:w-64" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-8 sm:h-9 w-24 sm:w-32" />
                            <Skeleton className="h-8 sm:h-9 w-20 sm:w-24" />
                            <Skeleton className="h-8 sm:h-9 w-24 sm:w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-12 w-full" />
                    <div className="flex flex-col md:grid md:grid-cols-4 gap-4 md:gap-6">
                        {[1, 2, 3, 4].map((col) => (
                            <div key={col} className="space-y-3">
                                <Skeleton className="h-6 w-32" />
                                {[1, 2, 3].map((card) => (
                                    <Card key={card} className="p-4">
                                        <div className="space-y-3">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-4 w-1/2" />
                                            <div className="flex justify-between">
                                                <Skeleton className="h-6 w-16 rounded-full" />
                                                <Skeleton className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row">
            <div className="flex-1 p-3 sm:p-4">
                <div className="max-w-7xl mx-auto">
                    {/* Mobile-Responsive Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="flex-shrink-0">
                                <ArrowLeft className="h-4 w-4" />
                                <span className="ml-1 hidden sm:inline">Back</span>
                            </Button>
                            <h1 className="text-lg sm:text-2xl font-bold truncate">{currentProject?.name}</h1>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <InviteMemberDialog projectId={id} />
                            <Button variant="outline" size="sm" onClick={() => setShowSidebar(!showSidebar)} className="flex-shrink-0">
                                {showSidebar ? <ActivityIcon className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                                <span className="ml-1 hidden sm:inline">{showSidebar ? 'Activity' : 'Info'}</span>
                            </Button>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        onClick={(e) => {
                                            if (isViewer) {
                                                e.preventDefault();
                                                toast.error("Permission Denied", { description: "Viewers cannot create tasks." });
                                            }
                                        }}
                                        className={isViewer ? "opacity-50 cursor-not-allowed" : ""}
                                        size="sm"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span className="ml-1 hidden sm:inline">New Task</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[95vw] sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Create Task</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateTask}>
                                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
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
                                            <div className="grid gap-2">
                                                <Label htmlFor="assignees">Assignees</Label>
                                                <Select
                                                    onValueChange={(value) => {
                                                        if (!newTask.assignees.includes(value)) {
                                                            setNewTask({ ...newTask, assignees: [...newTask.assignees, value] });
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select members" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {currentProject?.members?.map(member => (
                                                            <SelectItem key={member.user._id} value={member.user._id}>
                                                                {member.user.username}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {newTask.assignees.map(assigneeId => {
                                                        const member = currentProject?.members?.find(m => m.user._id === assigneeId);
                                                        return (
                                                            <span key={assigneeId} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                                {member?.user.username}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setNewTask({
                                                                        ...newTask,
                                                                        assignees: newTask.assignees.filter(id => id !== assigneeId)
                                                                    })}
                                                                    className="hover:text-blue-900"
                                                                >
                                                                    ×
                                                                </button>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="dueDate">Due Date</Label>
                                                <Input
                                                    id="dueDate"
                                                    type="date"
                                                    value={newTask.dueDate}
                                                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isCreatingTask}>
                                                {isCreatingTask ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    'Create Task'
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Filters and Bulk Actions */}
                    <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                        <TaskFilters
                            onFilterChange={handleFilterChange}
                            showMyTasks={showMyTasks}
                            onMyTasksToggle={handleMyTasksToggle}
                        />
                        <BulkActions
                            selectedTasks={selectedTasks}
                            onActionComplete={handleBulkActionComplete}
                            projectMembers={currentProject?.members || []}
                            userRole={userRole}
                        />
                    </div>

                    {/* Mobile-Responsive Kanban Board */}
                    <div className="flex flex-col md:grid md:grid-cols-4 gap-4 md:gap-6 md:h-[calc(100vh-280px)] pb-4">
                        {columns.map((column) => (
                            <div key={column} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 sm:p-4 flex flex-col gap-3 min-h-[200px] md:min-h-0">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm sm:text-base">{column}</h3>
                                <div className="flex-1 overflow-y-auto space-y-3">
                                    {tasks
                                        .filter((task) => task.status === column)
                                        .map((task) => (
                                            <Card
                                                key={task._id}
                                                className={`cursor-pointer hover:shadow-md transition-shadow ${selectedTasks.includes(task._id) ? 'ring-2 ring-blue-500' : ''} ${task.assignees?.some(a => a._id === user?._id) ? 'border-l-4 border-l-blue-500' : ''}`}
                                                onClick={() => setSelectedTask(task)}
                                            >
                                                <CardHeader className="p-3 sm:p-4">
                                                    <div className="flex items-start gap-2">
                                                        <Checkbox
                                                            checked={selectedTasks.includes(task._id)}
                                                            onCheckedChange={(checked) => handleTaskSelect(checked, task._id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="mt-1"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <CardTitle className="text-sm font-medium truncate">{task.title}</CardTitle>
                                                            <div className="flex justify-between items-center mt-2 gap-2">
                                                                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${task.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                                                                    task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                                                        task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-green-100 text-green-800'
                                                                    }`}>
                                                                    {task.priority}
                                                                </span>
                                                                {task.attachments?.length > 0 && (
                                                                    <Paperclip className="h-3 w-3 text-gray-400 flex-shrink-0" />
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

            {/* Mobile-Responsive Sidebar */}
            {showSidebar && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setShowSidebar(false)}
                    />
                    <div className="fixed md:relative inset-y-0 right-0 w-full sm:w-80 md:w-80 bg-white dark:bg-gray-800 border-l p-4 overflow-y-auto z-50 md:z-auto">
                        <div className="flex items-center justify-between mb-4 md:hidden">
                            <h2 className="text-lg font-semibold">Project Info</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowSidebar(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <ActivityFeed projectId={id} />
                            <InvitationsList projectId={id} />
                        </div>
                    </div>
                </>
            )}

            {/* Task Details Dialog */}
            <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label className="font-semibold">Status</Label>
                                <div className="mt-1">
                                    <Select
                                        value={selectedTask?.status}
                                        disabled={isViewer}
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
                            <div>
                                <Label className="font-semibold">Assignees</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedTask?.assignees?.map(assignee => (
                                        <span key={assignee._id} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                            {assignee.username}
                                        </span>
                                    ))}
                                    {selectedTask?.assignees?.length === 0 && (
                                        <span className="text-sm text-gray-500">Unassigned</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Label className="font-semibold">Due Date</Label>
                                <p className="mt-2 text-sm">
                                    {selectedTask?.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No due date'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <Label className="font-semibold">Attachments</Label>
                            <div className="mt-2 space-y-2">
                                {selectedTask?.attachments?.map((file, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 border rounded bg-gray-50 dark:bg-gray-800">
                                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
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
                            {!isViewer && <FileUpload taskId={selectedTask?._id} onUploadComplete={(updatedTask) => {
                                setSelectedTask(updatedTask);
                            }} />}
                            {isViewer && <p className="text-sm text-gray-500 italic text-center">Viewers cannot upload files.</p>}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProjectBoard;
