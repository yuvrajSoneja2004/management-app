import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '../api/axios';
import { Loader2, Upload } from 'lucide-react';

const FileUpload = ({ taskId, onUploadComplete }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post(`/files/upload/${taskId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setFile(null);
            if (onUploadComplete) onUploadComplete(res.data);
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="file">Upload Attachment</Label>
                <Input id="file" type="file" onChange={handleFileChange} />
            </div>
            <Button onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                    </>
                ) : (
                    <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                    </>
                )}
            </Button>
        </div>
    );
};

export default FileUpload;
