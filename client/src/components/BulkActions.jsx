import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { X, CheckSquare, Trash2, UserPlus, ArrowRight } from 'lucide-react';

const BulkActions = ({ selectedCount, onClearSelection, onBulkStatus, onBulkAssign, onBulkDelete, members = [] }) => {
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedAssignees, setSelectedAssignees] = useState([]);

    if (selectedCount === 0) return null;

    const handleStatusSubmit = () => {
        if (selectedStatus) {
            onBulkStatus(selectedStatus);
            setStatusDialogOpen(false);
            setSelectedStatus('');
        }
    };

    const handleAssignSubmit = () => {
        if (selectedAssignees.length > 0) {
            onBulkAssign(selectedAssignees);
            setAssignDialogOpen(false);
            setSelectedAssignees([]);
        }
    };

    const handleDeleteSubmit = () => {
        onBulkDelete();
        setDeleteDialogOpen(false);
    };

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border shadow-lg rounded-lg px-6 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-2 border-r pr-4">
                <div className="bg-blue-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {selectedCount}
                </div>
                <span className="text-sm font-medium">Selected</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClearSelection}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(true)}>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Set Status
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAssignDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                </Button>
            </div>

            {/* Status Dialog */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Update Status for {selectedCount} tasks</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="mb-2 block">Select New Status</Label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Todo">Todo</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Review">Review</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleStatusSubmit} disabled={!selectedStatus}>Update</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Assign {selectedCount} tasks</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="mb-2 block">Select Members</Label>
                        <div className="border rounded-md p-2 max-h-60 overflow-y-auto space-y-2">
                            {members.map(member => (
                                <div key={member.user._id} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id={`member-${member.user._id}`}
                                        checked={selectedAssignees.includes(member.user._id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedAssignees([...selectedAssignees, member.user._id]);
                                            } else {
                                                setSelectedAssignees(selectedAssignees.filter(id => id !== member.user._id));
                                            }
                                        }}
                                        className="rounded border-gray-300"
                                    />
                                    <label htmlFor={`member-${member.user._id}`} className="text-sm cursor-pointer flex-1">
                                        {member.user.username} ({member.role})
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssignSubmit} disabled={selectedAssignees.length === 0}>Assign</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete {selectedCount} tasks?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-muted-foreground">
                        Are you sure you want to delete these tasks? This action cannot be undone.
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteSubmit}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BulkActions;
