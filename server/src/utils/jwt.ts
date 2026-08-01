import jwt from 'jsonwebtoken';
import { config } from '../config';

export const signToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as any,
  });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, config.JWT_SECRET);
};
