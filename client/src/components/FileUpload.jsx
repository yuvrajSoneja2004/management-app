import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import api from '../api/axios';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

// Allowed file types (must match backend)
const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv', 'application/csv',
    'application/zip', 'application/x-zip-compressed'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const FileUpload = ({ taskId, onUploadComplete }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const validateFile = (file) => {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            toast.error('File too large', {
                description: `Maximum file size is 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`
            });
            return false;
        }

        // Check file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error('Invalid file type', {
                description: 'Allowed types: Images, PDF, Word, Excel, PowerPoint, Text, CSV, ZIP'
            });
            return false;
        }

        return true;
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validate before setting
            if (validateFile(selectedFile)) {
                setFile(selectedFile);
                setUploadProgress(0);
            } else {
                // Clear the input
                e.target.value = '';
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        // Double-check validation
        if (!validateFile(file)) {
            setFile(null);
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post(`/files/upload/${taskId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                },
            });
            setFile(null);
            setUploadProgress(0);
            toast.success('File uploaded successfully');
            if (onUploadComplete) onUploadComplete(res.data);
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadProgress(0);
            toast.error(error.response?.data?.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        setFile(null);
        setUploadProgress(0);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="file">Upload Attachment</Label>
                <div className="flex gap-2">
                    <Input
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="flex-1"
                        accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                    />
                    {file && !uploading && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancel}
                            title="Clear selection"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                {file && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Selected: <span className="font-medium">{file.name}</span> ({formatFileSize(file.size)})
                    </p>
                )}
            </div>

            {uploading && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                </div>
            )}

            <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
                {uploading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading... {uploadProgress}%
                    </>
                ) : (
                    <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                    </>
                )}
            </Button>

            <p className="text-xs text-gray-500 dark:text-gray-400">
                Max file size: 5MB. Supported: Images, PDF, Word, Excel, PowerPoint, Text, CSV, ZIP
            </p>
        </div>
    );
};

export default FileUpload;
