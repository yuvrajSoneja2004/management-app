import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetProjectsQuery, useCreateProjectMutation, useArchiveProjectMutation, useUnarchiveProjectMutation } from '@/store/api/projectsApi';
import { useLogoutMutation } from '@/store/api/authApi';
import useAuthStore from '../store/authStore';
import { projectSchema } from '@/lib/validationSchemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, LogOut, FolderKanban, Users, CheckCircle2, Clock, Loader2, Archive, ArchiveRestore } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import ProjectCardSkeleton from '@/components/skeletons/ProjectCardSkeleton';
import { Pagination } from '@/components/ui/pagination';

const Dashboard = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const projectsPerPage = 6;

    const { data, isLoading, error } = useGetProjectsQuery({
        page: currentPage,
        limit: projectsPerPage,
        status: 'Active'
    });
    const [createProject] = useCreateProjectMutation();
    const [archiveProject] = useArchiveProjectMutation();
    const [unarchiveProject] = useUnarchiveProjectMutation();
    const [logout] = useLogoutMutation();
    const { user, clearAuth } = useAuthStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const navigate = useNavigate();

    // Safely access projects with default empty array
    const projects = data?.projects || [];
    const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: '',
            description: '',
            startDate: '',
            endDate: '',
            tags: '',
        },
    });

    const onSubmit = async (data) => {
        try {
            const projectData = {
                ...data,
                tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            };
            await createProject(projectData).unwrap();
            toast.success('Project created successfully!');
            setIsDialogOpen(false);
            reset();
        } catch (error) {
            toast.error(error?.data?.error || 'Failed to create project');
        }
    };

    const handleLogout = async () => {
        try {
            await logout().unwrap();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearAuth();
            navigate('/login');
        }
    };

    const handleArchive = async (e, projectId) => {
        e.stopPropagation();
        try {
            await archiveProject(projectId).unwrap();
            toast.success('Project archived successfully');
        } catch (error) {
            toast.error('Failed to archive project');
        }
    };

    const handleUnarchive = async (e, projectId) => {
        e.stopPropagation();
        try {
            await unarchiveProject(projectId).unwrap();
            toast.success('Project restored successfully');
        } catch (error) {
            toast.error('Failed to restore project');
        }
    };

    // Check if user is admin/owner of a project
    const isProjectAdmin = (project) => {
        if (!project || !user) return false;
        const isOwner = project.owner === user._id || project.owner?._id === user._id;
        const member = project.members?.find(m => (m.user?._id || m.user) === user._id);
        return isOwner || member?.role === 'Admin';
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Modern Header with Gradient */}
            <header className="gradient-primary text-white shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 gradient-mesh opacity-20"></div>
                <div className="container-responsive relative z-10">
                    <div className="py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="animate-slide-down">
                            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                                My Projects
                            </h1>
                            <p className="text-blue-100">
                                Welcome back, <span className="font-semibold">{user?.username}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3 animate-slide-down">
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-white text-blue-600 hover:bg-blue-50 shadow-md font-medium">
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Project
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl">Create New Project</DialogTitle>
                                        <DialogDescription>
                                            Start a new project to collaborate with your team.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <div className="grid gap-6 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-sm font-medium">
                                                    Project Name *
                                                </Label>
                                                <Input
                                                    id="name"
                                                    placeholder="My Awesome Project"
                                                    {...register('name')}
                                                    className={`h-11 input-focus ${errors.name ? 'border-red-500' : ''}`}
                                                />
                                                {errors.name && (
                                                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description" className="text-sm font-medium">
                                                    Description
                                                </Label>
                                                <Textarea
                                                    id="description"
                                                    placeholder="Describe your project..."
                                                    {...register('description')}
                                                    className={`min-h-[100px] resize-none input-focus ${errors.description ? 'border-red-500' : ''}`}
                                                />
                                                {errors.description && (
                                                    <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
                                                    <Input
                                                        id="startDate"
                                                        type="date"
                                                        {...register('startDate')}
                                                        className={`h-11 input-focus ${errors.startDate ? 'border-red-500' : ''}`}
                                                    />
                                                    {errors.startDate && (
                                                        <p className="text-sm text-red-500 mt-1">{errors.startDate.message}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="endDate" className="text-sm font-medium">End Date</Label>
                                                    <Input
                                                        id="endDate"
                                                        type="date"
                                                        {...register('endDate')}
                                                        className={`h-11 input-focus ${errors.endDate ? 'border-red-500' : ''}`}
                                                    />
                                                    {errors.endDate && (
                                                        <p className="text-sm text-red-500 mt-1">{errors.endDate.message}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tags" className="text-sm font-medium">Tags (comma separated)</Label>
                                                <Input
                                                    id="tags"
                                                    placeholder="Design, Development, Urgent"
                                                    {...register('tags')}
                                                    className={`h-11 input-focus ${errors.tags ? 'border-red-500' : ''}`}
                                                />
                                                {errors.tags && (
                                                    <p className="text-sm text-red-500 mt-1">{errors.tags.message}</p>
                                                )}
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="btn-gradient font-medium"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    'Create Project'
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/archived')}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                            >
                                <Archive className="h-4 w-4 mr-2" />
                                Archived
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container-responsive py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
                    <Card className="border-0 shadow-soft hover-lift">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Projects
                            </CardTitle>
                            <FolderKanban className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{pagination.total || 0}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-soft hover-lift">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Active Projects
                            </CardTitle>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {projects?.filter(p => p.status === 'Active').length || 0}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-soft hover-lift">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Completed
                            </CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {projects?.filter(p => p.status === 'Completed').length || 0}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-soft hover-lift">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Team Members
                            </CardTitle>
                            <Users className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {new Set(
                                    (projects || [])
                                        .filter(p => p.members && Array.isArray(p.members))
                                        .flatMap(p => p.members.map(m => m.user?._id || m.user))
                                        .filter(Boolean)
                                ).size}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Projects Grid */}
                {isLoading ? (
                    <div className="space-y-8 animate-fade-in">
                        {/* Skeleton Project Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <ProjectCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {(projects?.length === 0 || !projects) ? (
                            <div className="text-center py-20 animate-fade-in">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
                                    <FolderKanban className="h-8 w-8 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                    Get started by creating your first project and invite your team to collaborate.
                                </p>
                                <Button onClick={() => setIsDialogOpen(true)} className="btn-gradient">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Project
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                                {projects?.map((project) => {
                                    const isArchived = project.status === 'Archived';
                                    const isAdmin = isProjectAdmin(project);

                                    return (
                                        <Card
                                            key={project._id}
                                            className={`card-hover border-0 shadow-soft group ${isArchived
                                                ? 'opacity-60 bg-gray-50 dark:bg-gray-900/50 cursor-default'
                                                : 'cursor-pointer'
                                                }`}
                                            onClick={() => !isArchived && navigate(`/projects/${project._id}`)}
                                        >
                                            <CardHeader>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <CardTitle className={`text-xl ${isArchived
                                                                ? 'text-gray-500 dark:text-gray-600'
                                                                : 'group-hover:text-blue-600 transition-colors'
                                                                }`}>
                                                                {project.name}
                                                            </CardTitle>
                                                            {isArchived && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                                                                    <Archive className="h-3 w-3 mr-1" />
                                                                    Archived
                                                                </span>
                                                            )}
                                                        </div>
                                                        <CardDescription className="line-clamp-2">
                                                            {project.description || 'No description'}
                                                        </CardDescription>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {project.tags?.map((tag, idx) => (
                                                                <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full dark:bg-blue-900/20 dark:text-blue-400">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {project.startDate && project.endDate && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${project.status === 'Active'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                                : project.status === 'Archived'
                                                                    ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                                                }`}
                                                        >
                                                            {project.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Users className="h-4 w-4" />
                                                        <span className="font-medium">{project.members?.length || 0}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="pt-0 flex gap-2">
                                                {!isArchived ? (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            className="flex-1 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/projects/${project._id}`);
                                                            }}
                                                        >
                                                            Open Project
                                                        </Button>
                                                        {isAdmin && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                                onClick={(e) => handleArchive(e, project._id)}
                                                                title="Archive project"
                                                            >
                                                                <Archive className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            className="flex-1"
                                                            disabled
                                                        >
                                                            Archived
                                                        </Button>
                                                        {isAdmin && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                                onClick={(e) => handleUnarchive(e, project._id)}
                                                                title="Restore project"
                                                            >
                                                                <ArchiveRestore className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <Pagination
                                currentPage={pagination.page}
                                totalPages={pagination.pages}
                                onPageChange={setCurrentPage}
                                className="mt-8"
                            />
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
