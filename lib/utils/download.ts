export async function downloadFile(url: string, filename?: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;

    // If no filename provided, try to extract from URL or use default
    if (!filename) {
      const urlParts = url.split('/');
      filename = urlParts[urlParts.length - 1] || 'download';
    }

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

export async function downloadImage(imageUrl: string, imageName: string) {
  return downloadFile(imageUrl, imageName);
}

export async function downloadJSON(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);

  try {
    await downloadFile(url, filename);
  } finally {
    window.URL.revokeObjectURL(url);
  }
}