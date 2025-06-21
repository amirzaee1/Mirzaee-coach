
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export enum ChatRole {
  USER = "user",
  MODEL = "model"
}
