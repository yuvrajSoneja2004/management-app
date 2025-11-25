import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateProjectMutation, useUpdateProjectMutation } from '@/store/api/projectsApi';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const projectSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be less than 100 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

const ProjectForm = ({ project = null, onSuccess }) => {
    const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
    const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();

    const isEditing = !!project;
    const isLoading = isCreating || isUpdating;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(projectSchema),
        defaultValues: project || {},
    });

    const onSubmit = async (data) => {
        try {
            if (isEditing) {
                await updateProject({ id: project._id, ...data }).unwrap();
                toast.success('Project updated successfully!');
            } else {
                await createProject(data).unwrap();
                toast.success('Project created successfully!');
            }
            onSuccess?.();
        } catch (error) {
            toast.error(error?.data?.error || 'Operation failed. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter project name"
                    className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Enter project description"
                    rows={3}
                    className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                        id="startDate"
                        type="date"
                        {...register('startDate')}
                        className={errors.startDate ? 'border-red-500' : ''}
                    />
                    {errors.startDate && (
                        <p className="text-sm text-red-500 mt-1">{errors.startDate.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                        id="endDate"
                        type="date"
                        {...register('endDate')}
                        className={errors.endDate ? 'border-red-500' : ''}
                    />
                    {errors.endDate && (
                        <p className="text-sm text-red-500 mt-1">{errors.endDate.message}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
                </Button>
            </div>
        </form>
    );
};

export default ProjectForm;
