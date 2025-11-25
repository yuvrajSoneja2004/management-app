import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useProjectStore from '../store/projectStore';
import useAuthStore from '../store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, LogOut, FolderKanban, Users, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
    const { projects, fetchProjects, createProject, isLoading } = useProjectStore();
    const { user, logout } = useAuthStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await createProject(newProject);
            setIsDialogOpen(false);
            setNewProject({ name: '', description: '' });
        } finally {
            setIsCreating(false);
        }
    };

    // Calculate stats
    const activeProjects = projects.filter(p => p.status === 'Active').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const totalMembers = new Set(projects.flatMap(p => p.members.map(m => m.user?._id || m.user))).size;

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
                                    <form onSubmit={handleCreateProject}>
                                        <div className="grid gap-6 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-sm font-medium">
                                                    Project Name
                                                </Label>
                                                <Input
                                                    id="name"
                                                    placeholder="My Awesome Project"
                                                    value={newProject.name}
                                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                                    className="h-11 input-focus"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description" className="text-sm font-medium">
                                                    Description
                                                </Label>
                                                <Textarea
                                                    id="description"
                                                    placeholder="Describe your project..."
                                                    value={newProject.description}
                                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                                    className="min-h-[100px] resize-none input-focus"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                type="submit"
                                                disabled={isCreating}
                                                className="btn-gradient font-medium"
                                            >
                                                {isCreating ? (
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
                                onClick={logout}
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
                            <div className="text-3xl font-bold">{projects.length}</div>
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
                            <div className="text-3xl font-bold">{activeProjects}</div>
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
                            <div className="text-3xl font-bold">{completedProjects}</div>
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
                            <div className="text-3xl font-bold">{totalMembers}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Projects Grid */}
                {isLoading && projects.length === 0 ? (
                    <div className="space-y-8 animate-fade-in">
                        {/* Skeleton Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <Card key={i} className="border-0 shadow-soft">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-4 rounded" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-8 w-16" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Skeleton Project Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Card key={i} className="border-0 shadow-soft">
                                    <CardHeader>
                                        <Skeleton className="h-6 w-3/4 mb-2" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        <Skeleton className="h-9 w-full" />
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {projects.length === 0 ? (
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
                                {projects.map((project) => (
                                    <Card
                                        key={project._id}
                                        className="card-hover border-0 shadow-soft cursor-pointer group"
                                        onClick={() => navigate(`/projects/${project._id}`)}
                                    >
                                        <CardHeader>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <CardTitle className="text-xl mb-2 group-hover:text-blue-600 transition-colors">
                                                        {project.name}
                                                    </CardTitle>
                                                    <CardDescription className="line-clamp-2">
                                                        {project.description || 'No description'}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${project.status === 'Active'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                            : project.status === 'Completed'
                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                            }`}
                                                    >
                                                        {project.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Users className="h-4 w-4" />
                                                    <span className="font-medium">{project.members.length}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-0">
                                            <Button
                                                variant="ghost"
                                                className="w-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/projects/${project._id}`);
                                                }}
                                            >
                                                Open Project
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
