import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetProjectQuery } from '@/store/api/projectsApi';
import { useGetTasksQuery, useCreateTaskMutation, useUpdateTaskMutation } from '@/store/api/tasksApi';
import useAuthStore from '../store/authStore';
import useSocket from '@/hooks/useSocket';
import useRealtimeUpdates from '@/hooks/useRealtimeUpdates';
import useSocketStore from '@/store/socketStore';
import { taskSchema } from '@/lib/validationSchemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ArrowLeft, Paperclip, FileText, Activity as ActivityIcon, Users, Loader2, X, Download } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import InviteMemberDialog from '../components/InviteMemberDialog';
import InvitationsList from '../components/InvitationsList';
import ActivityFeed from '../components/ActivityFeed';
import TaskFilters from '../components/TaskFilters';
import BulkActions from '../components/BulkActions';
import ProjectStatistics from '../components/ProjectStatistics';
import TaskCardSkeleton from '@/components/skeletons/TaskCardSkeleton';
import KanbanBoard from '../components/KanbanBoard';
import ActiveUsers from '../components/ActiveUsers';
import { toast } from 'sonner';

const ProjectBoard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // RTK Query hooks
    const { data: projectData, isLoading: isLoadingProject } = useGetProjectQuery(id);
    const [createTask] = useCreateTaskMutation();
    const [updateTask] = useUpdateTaskMutation();

    // Socket.io integration
    useSocket(); // Initialize socket connection
    useRealtimeUpdates(id); // Listen for real-time updates
    const { joinProject, leaveProject } = useSocketStore();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState([]);

    const {
        register: registerTask,
        handleSubmit: handleSubmitTask,
        formState: { errors: taskErrors, isSubmitting: isCreatingTask },
        reset: resetTask,
    } = useForm({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            status: 'Todo',
            priority: 'Medium',
            assignees: [],
            dueDate: '',
            tags: '',
            estimatedTime: '',
        },
    });

    const currentProject = projectData;
    const isLoading = isLoadingProject;

    // Get user role
    const userRole = currentProject?.members?.find(m => m.user?._id === user?._id || m.user === user?._id)?.role || 'Viewer';
    const isArchived = currentProject?.status === 'Archived';
    // Treat as viewer if role is Viewer OR project is archived
    const isViewer = (userRole?.toLowerCase() === 'viewer') || isArchived;

    useEffect(() => {
        if (id) {
            joinProject(id);
        }
        return () => {
            if (id) {
                leaveProject(id);
            }
        };
    }, [id, joinProject, leaveProject]);

    const onSubmitTask = async (data) => {
        if (isViewer) {
            const message = isArchived ? "Project is archived." : "Viewers cannot create tasks.";
            toast.error("Permission Denied", { description: message });
            return;
        }
        try {
            const taskData = {
                ...data,
                projectId: id,
                tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                estimatedTime: data.estimatedTime ? Number(data.estimatedTime) : undefined,
                dueDate: data.dueDate || undefined,
            };
            await createTask(taskData).unwrap();
            setIsDialogOpen(false);
            resetTask();
            toast.success("Task created successfully");
        } catch (error) {
            toast.error(error?.data?.error || "Failed to create task");
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        if (isViewer) {
            const message = isArchived ? "Project is archived." : "Viewers cannot update task status.";
            toast.error("Permission Denied", { description: message });
            return;
        }
        try {
            await updateTask({ id: taskId, status: newStatus, projectId: id }).unwrap();
            toast.success("Task status updated");
        } catch (error) {
            toast.error(error?.data?.error || "Failed to update task");
        }
    };

    const handleTaskSelect = (checked, taskId) => {
        setSelectedTasks(prev =>
            checked ? [...prev, taskId] : prev.filter(id => id !== taskId)
        );
    };

    const clearSelection = () => setSelectedTasks([]);

    const columns = ['Todo', 'In Progress', 'Review', 'Completed'];

    if (isLoading && !currentProject) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <TaskCardSkeleton />
                        </div>
                    </div>
                    <div className="flex flex-col md:grid md:grid-cols-4 gap-4 md:gap-6">
                        {[1, 2, 3, 4].map((col) => (
                            <div key={col} className="space-y-3">
                                {[1, 2, 3].map((card) => (
                                    <TaskCardSkeleton key={card} />
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
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="flex-shrink-0">
                                <ArrowLeft className="h-4 w-4" />
                                <span className="ml-1 hidden sm:inline">Back</span>
                            </Button>
                            <h1 className="text-lg sm:text-2xl font-bold truncate">{currentProject?.name}</h1>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <ActiveUsers projectId={id} />
                            <InviteMemberDialog projectId={id} />
                            <Button variant="outline" size="sm" onClick={() => setShowSidebar(!showSidebar)} className="flex-shrink-0">
                                {showSidebar ? <ActivityIcon className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                                <span className="ml-1 hidden sm:inline">{showSidebar ? 'Activity' : 'Info'}</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)} className={`flex-shrink-0 ${showStats ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}>
                                <ActivityIcon className="h-4 w-4" />
                                <span className="ml-1 hidden sm:inline">Stats</span>
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
                                    <form onSubmit={handleSubmitTask(onSubmitTask)}>
                                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                                            <div className="grid gap-2">
                                                <Label htmlFor="title">Title *</Label>
                                                <Input
                                                    id="title"
                                                    {...registerTask('title')}
                                                    className={taskErrors.title ? 'border-red-500' : ''}
                                                />
                                                {taskErrors.title && (
                                                    <p className="text-sm text-red-500">{taskErrors.title.message}</p>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="description">Description</Label>
                                                <Textarea
                                                    id="description"
                                                    {...registerTask('description')}
                                                    className={taskErrors.description ? 'border-red-500' : ''}
                                                />
                                                {taskErrors.description && (
                                                    <p className="text-sm text-red-500">{taskErrors.description.message}</p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="status">Status *</Label>
                                                    <Select
                                                        defaultValue="Todo"
                                                        onValueChange={(value) => registerTask('status').onChange({ target: { value, name: 'status' } })}
                                                    >
                                                        <SelectTrigger className={taskErrors.status ? 'border-red-500' : ''}>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {columns.map(col => (
                                                                <SelectItem key={col} value={col}>{col}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {taskErrors.status && (
                                                        <p className="text-sm text-red-500">{taskErrors.status.message}</p>
                                                    )}
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="priority">Priority *</Label>
                                                    <Select
                                                        defaultValue="Medium"
                                                        onValueChange={(value) => registerTask('priority').onChange({ target: { value, name: 'priority' } })}
                                                    >
                                                        <SelectTrigger className={taskErrors.priority ? 'border-red-500' : ''}>
                                                            <SelectValue placeholder="Select priority" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Low">Low</SelectItem>
                                                            <SelectItem value="Medium">Medium</SelectItem>
                                                            <SelectItem value="High">High</SelectItem>
                                                            <SelectItem value="Critical">Critical</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {taskErrors.priority && (
                                                        <p className="text-sm text-red-500">{taskErrors.priority.message}</p>
                                                    )}
                                                </div>
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

                    {showStats ? (
                        <div className="mb-6 animate-fade-in">
                            <ProjectStatistics projectId={id} />
                        </div>
                    ) : (
                        <div className="h-[calc(100vh-280px)] pb-4">
                            <KanbanBoard
                                projectId={id}
                                onTaskClick={(task) => setSelectedTask(task)}
                                onAddTask={(status) => {
                                    setIsDialogOpen(true);
                                    // Pre-select status if needed, though form uses default
                                    // You might want to update form default values here if supported
                                }}
                                isViewer={isViewer}
                                selectedTasks={selectedTasks}
                                onTaskSelect={(taskId) => handleTaskSelect(!selectedTasks.includes(taskId), taskId)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            {showSidebar && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setShowSidebar(false)}
                    />
                    <div className="fixed md:relative inset-y-0 right-0 w-full sm:w-80 md:w-80 bg-white dark:bg-gray-800 border-l z-50 md:z-auto flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b md:hidden flex-shrink-0">
                            <h2 className="text-lg font-semibold">Project Info</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowSidebar(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                        </div>

                        <div className="border-t pt-4">
                            <div className="mb-4">
                                <Label className="font-semibold mb-2 block">Attachments</Label>
                                {selectedTask?.attachments && selectedTask.attachments.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedTask.attachments.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <FileText className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                                    <span className="text-sm truncate" title={file.name}>{file.name}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        // Force download by creating a temporary link
                                                        const link = document.createElement('a');
                                                        link.href = file.url;
                                                        link.download = file.name; // This attribute forces download
                                                        link.target = '_blank';
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                    }}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No attachments.</p>
                                )}
                            </div>

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
