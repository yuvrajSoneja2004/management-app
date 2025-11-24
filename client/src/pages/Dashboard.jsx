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
import { Plus, LogOut } from 'lucide-react';

const Dashboard = () => {
    const { projects, fetchProjects, createProject, isLoading } = useProjectStore();
    const { user, logout } = useAuthStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        await createProject(newProject);
        setIsDialogOpen(false);
        setNewProject({ name: '', description: '' });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Projects</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">Welcome, {user?.username}</span>
                        <Button variant="outline" size="sm" onClick={logout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-end mb-6">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Project
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Create Project</DialogTitle>
                                    <DialogDescription>
                                        Create a new project to start collaborating with your team.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateProject}>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="name" className="text-right">
                                                Name
                                            </Label>
                                            <Input
                                                id="name"
                                                value={newProject.name}
                                                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                                className="col-span-3"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="description" className="text-right">
                                                Description
                                            </Label>
                                            <Textarea
                                                id="description"
                                                value={newProject.description}
                                                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                                className="col-span-3"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={isLoading}>Create Project</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {isLoading && projects.length === 0 ? (
                        <p>Loading projects...</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {projects.map((project) => (
                                <Card key={project._id} className="hover:shadow-lg transition-shadow cursor-pointer">
                                    <CardHeader>
                                        <CardTitle>{project.name}</CardTitle>
                                        <CardDescription>{project.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between text-sm text-gray-500">
                                            <span>Status: {project.status}</span>
                                            <span>Members: {project.members.length}</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            variant="secondary"
                                            className="w-full"
                                            onClick={() => navigate(`/projects/${project._id}`)}
                                        >
                                            Open Project
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                            {projects.length === 0 && (
                                <div className="col-span-full text-center py-12 text-gray-500">
                                    No projects found. Create one to get started!
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
