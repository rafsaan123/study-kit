export const downloadFile = async (fileUrl: string, fileName: string): Promise<void> => {
  try {
    if (!fileUrl) {
      throw new Error('File URL is missing');
    }

    // Remove any leading slash to avoid double slashes
    const cleanFileUrl = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;

    // Construct the full URL using window.location.origin
    const fullUrl = `${window.location.origin}/${cleanFileUrl}`;

    console.log('Attempting to download from:', fullUrl); // Debug log

    const response = await fetch(fullUrl);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('Failed to download file. Please try again.');
  }
};