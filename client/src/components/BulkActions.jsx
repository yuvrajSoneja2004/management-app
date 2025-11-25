import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Trash2, UserPlus } from 'lucide-react';
import { bulkUpdateStatus, bulkAssign, bulkDelete } from '../api/project';
import { toast } from 'sonner';

const BulkActions = ({ selectedTasks, onActionComplete, members = [], userRole }) => {
    const [isLoading, setIsLoading] = useState(false);

    const isViewer = userRole?.toLowerCase() === 'viewer';

    if (selectedTasks.length === 0) return null;

    const handleBulkStatus = async (status) => {
        if (isViewer) {
            toast.error("Permission Denied", { description: "Viewers cannot change task status." });
            return;
        }
        setIsLoading(true);
        try {
            await bulkUpdateStatus(selectedTasks, status);
            onActionComplete();
            toast.success(`${selectedTasks.length} task(s) updated successfully`);
        } catch (error) {
            console.error('Bulk status update failed:', error);
            toast.error(error.response?.data?.message || 'Failed to update tasks');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkAssign = async (assigneeId) => {
        if (isViewer) {
            toast.error("Permission Denied", { description: "Viewers cannot assign tasks." });
            return;
        }
        setIsLoading(true);
        try {
            await bulkAssign(selectedTasks, [assigneeId]);
            onActionComplete();
            toast.success(`${selectedTasks.length} task(s) assigned successfully`);
        } catch (error) {
            console.error('Bulk assign failed:', error);
            toast.error(error.response?.data?.message || 'Failed to assign tasks');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (isViewer) {
            toast.error("Permission Denied", { description: "Viewers cannot delete tasks." });
            return;
        }
        if (!confirm(`Are you sure you want to delete ${selectedTasks.length} task(s)?`)) {
            return;
        }

        setIsLoading(true);
        try {
            await bulkDelete(selectedTasks);
            onActionComplete();
            toast.success(`${selectedTasks.length} task(s) deleted successfully`);
        } catch (error) {
            console.error('Bulk delete failed:', error);
            toast.error(error.response?.data?.message || 'Failed to delete tasks');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
            <CheckSquare className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2 ml-auto">
                <Select onValueChange={handleBulkStatus} disabled={isLoading || isViewer}>
                    <SelectTrigger className="w-[140px] h-8">
                        <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Todo">Todo</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Review">Review</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                </Select>

                <Select onValueChange={handleBulkAssign} disabled={isLoading || isViewer}>
                    <SelectTrigger className="w-[140px] h-8">
                        <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                        {members.map((member) => (
                            <SelectItem key={member.user._id} value={member.user._id}>
                                {member.user.username}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isLoading || isViewer}
                    className={isViewer ? "opacity-50 cursor-not-allowed" : ""}
                >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                </Button>
            </div>
        </div>
    );
};

export default BulkActions;
