import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const generateResponse = async (prompt: string, imageFile?: File): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    // Fix: Explicitly type `parts` to allow a union of text and inlineData parts.
    const parts: ({ text: string } | { inlineData: { data: string; mimeType: string } })[] = [{ text: prompt }];

    if (imageFile) {
      const imagePart = await fileToGenerativePart(imageFile);
      parts.unshift(imagePart); // Image first, then text
    }

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.5,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating response from Gemini:", error);
    return "I'm sorry, but I encountered an error while processing your request. Please check your connection and API key, then try again.";
  }
};