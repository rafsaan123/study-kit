export const uploadFile = async (file: File, folder: string = 'uploads') => {
  try {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('folder', folder);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload file');
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].fileUrl;
    }
    throw new Error('No file URL returned');
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const uploadFiles = async (files: File[], folder: string = 'uploads') => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('folder', folder);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload files');
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};