import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, Upload, X } from 'lucide-react';
import { patientSchema } from '../schemas/patientSchema';
import { Button, Input, Card } from './ui';

export const PatientForm = ({ onSubmit, loading = false }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(patientSchema),
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);

    const fileInput = document.getElementById('image-upload');
    if (fileInput) fileInput.value = '';
  };

  const onFormSubmit = async (data) => {
    try {
      await onSubmit(data, imageFile);
      reset();
      removeImage();
    } catch (error) {
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <UserPlus className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Add New Patient</h2>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Enter patient's full name"
          {...register('name')}
          error={errors.name?.message}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="Enter patient's email"
          {...register('email')}
          error={errors.email?.message}
        />

        <Input
          label="Phone Number"
          placeholder="+1234567890"
          {...register('phoneNumber')}
          error={errors.phoneNumber?.message}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Profile Photo (Optional)
          </label>
          <div className="flex items-center gap-4">
            <label 
              htmlFor="image-upload" 
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Choose File
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {imageFile && (
              <span className="text-sm text-gray-600">{imageFile.name}</span>
            )}
          </div>
          
          {imagePreview && (
            <div className="relative inline-block mt-2">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-20 h-20 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Adding Patient...' : 'Add Patient'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
