import { useState } from 'react';
import toast from 'react-hot-toast';

const ProofUploadModal = ({ task, isOpen, onClose, onUploadSuccess }) => {
  const [proofImage, setProofImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }

      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!proofImage) {
      toast.error('Please select an image');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('proofImage', proofImage);

      await onUploadSuccess(task.id, formData);
      toast.success('Proof uploaded successfully');
      onClose();
      setProofImage(null);
      setPreview(null);
    } catch (error) {
      toast.error('Failed to upload proof');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setProofImage(null);
    setPreview(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg p-6 w-full max-w-md border border-border">
        <h3 className="text-xl font-bold mb-4 text-text-primary">Upload Proof of Work</h3>
        <p className="text-text-secondary mb-4">
          Upload a photo showing the completed work at the location. This serves as proof that the garbage has been collected.
        </p>

        {/* Image Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-text-primary">Proof Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            required
          />
        </div>

        {/* Preview */}
        {preview && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-text-primary">Preview</label>
            <img 
              src={preview} 
              alt="Proof preview" 
              className="w-full h-48 object-cover rounded-md border border-border"
            />
          </div>
        )}

        {/* Task Info */}
        <div className="bg-surfaceLight p-3 rounded-md mb-4 border border-border">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">Task ID:</strong> #{task.id}
          </p>
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">Location:</strong> {task.latitude.toFixed(4)}, {task.longitude.toFixed(4)}
          </p>
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">Status:</strong> {task.status}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 bg-surfaceLight hover:bg-surface text-text-primary font-medium rounded-md transition duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!proofImage || uploading}
            className="px-4 py-2 bg-status-success hover:bg-status-success/90 text-white font-medium rounded-md transition duration-200 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Proof'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProofUploadModal;
