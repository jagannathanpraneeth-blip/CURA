import React from 'react';

export enum ChatRole {
  USER = 'user',
  AI = 'ai',
}

export interface Message {
  role: ChatRole;
  text: string;
  image?: string;
}

export type ChatMode = 'symptom' | 'lab' | 'prescription' | 'medication';

export interface Feature {
    mode: ChatMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    initialMessage: string;
}