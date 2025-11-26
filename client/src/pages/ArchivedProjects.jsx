import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetProjectsQuery, useUnarchiveProjectMutation } from '@/store/api/projectsApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive, ArchiveRestore, ArrowLeft, Users, Loader2, FolderKanban } from 'lucide-react';
import { toast } from 'sonner';
import ProjectCardSkeleton from '@/components/skeletons/ProjectCardSkeleton';
import { Pagination } from '@/components/ui/pagination';
import useAuthStore from '@/store/authStore';

const ArchivedProjects = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const projectsPerPage = 6;
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const { data, isLoading } = useGetProjectsQuery({
        page: currentPage,
        limit: projectsPerPage,
        status: 'Archived'
    });

    const [unarchiveProject] = useUnarchiveProjectMutation();

    // Safely access projects
    const projects = data?.projects || [];
    const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

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
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="container-responsive py-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/')}
                            className="mr-2"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Archive className="h-6 w-6 text-gray-500" />
                                Archived Projects
                            </h1>
                            <p className="text-muted-foreground text-sm mt-1">
                                View and restore your archived projects
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container-responsive py-8">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <ProjectCardSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <>
                        {(projects?.length === 0 || !projects) ? (
                            <div className="text-center py-20 animate-fade-in">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                                    <Archive className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No archived projects</h3>
                                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                    Projects you archive will appear here.
                                </p>
                                <Button onClick={() => navigate('/')} variant="outline">
                                    Back to Dashboard
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                                {projects?.map((project) => {
                                    const isAdmin = isProjectAdmin(project);

                                    return (
                                        <Card
                                            key={project._id}
                                            className="border-0 shadow-soft bg-gray-50 dark:bg-gray-900/50"
                                        >
                                            <CardHeader>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <CardTitle className="text-xl text-gray-500 dark:text-gray-400">
                                                                {project.name}
                                                            </CardTitle>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                                                                <Archive className="h-3 w-3 mr-1" />
                                                                Archived
                                                            </span>
                                                        </div>
                                                        <CardDescription className="line-clamp-2">
                                                            {project.description || 'No description'}
                                                        </CardDescription>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {project.tags?.map((tag, idx) => (
                                                                <span key={idx} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full dark:bg-gray-800 dark:text-gray-400">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                            {project.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Users className="h-4 w-4" />
                                                        <span className="font-medium">{project.members?.length || 0}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="pt-0">
                                                {isAdmin ? (
                                                    <Button
                                                        variant="outline"
                                                        className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                        onClick={(e) => handleUnarchive(e, project._id)}
                                                    >
                                                        <ArchiveRestore className="h-4 w-4 mr-2" />
                                                        Restore Project
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full"
                                                        disabled
                                                    >
                                                        Read Only
                                                    </Button>
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

export default ArchivedProjects;
