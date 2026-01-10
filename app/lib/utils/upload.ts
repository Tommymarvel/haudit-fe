import axiosInstance from '@/lib/axiosinstance';

export const uploadFile = async (file: File, folderType: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folderType', folderType);

  try {
    const { data } = await axiosInstance.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    // Return the URL from the response. 
    // Adjusting to common patterns, but assuming 'url' or 'link' property exists, 
    // or the data itself is the string if it's a simple text response.
    return data.url || data.link || data.secure_url || data;
  } catch (error) {
    console.error('File upload failed:', error);
    throw new Error('Failed to upload file');
  }
};
