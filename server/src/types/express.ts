import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'student' | 'admin';
    rollNumber?: string;
    email: string;
  };
}
