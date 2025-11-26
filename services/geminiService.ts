import { storageService } from './storageService';

const API_URL = 'http://localhost:3000/api';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const generateResponse = async (mode: string, prompt: string, imageFile?: File): Promise<string> => {
  try {
    const userId = storageService.getUserId();
    let imageBase64 = undefined;

    if (imageFile) {
      imageBase64 = await fileToBase64(imageFile);
    }

    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        mode,
        message: prompt,
        image: imageBase64
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    return data.text;

  } catch (error: any) {
    console.error("Error calling backend:", error);
    if (error.message && error.message.includes('Failed to fetch')) {
        throw new Error("Cannot connect to backend server. Is 'node server.js' running?");
    }
    throw error;
  }
};