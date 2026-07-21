import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'eimp_super_secure_access_token_secret_998877';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'eimp_super_secure_refresh_token_secret_112233';

export interface ITokenPayload {
  userId: string;
  username: string;
  role: string;
  department: string;
}

export const generateAccessToken = (user: { _id: any; username: string; role: string; department: string }): string => {
  const payload: ITokenPayload = {
    userId: user._id.toString(),
    username: user.username,
    role: user.role,
    department: user.department
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (user: { _id: any; username: string; role: string; department: string }): string => {
  const payload: ITokenPayload = {
    userId: user._id.toString(),
    username: user.username,
    role: user.role,
    department: user.department
  };
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): ITokenPayload => {
  return jwt.verify(token, JWT_SECRET) as ITokenPayload;
};

export const verifyRefreshToken = (token: string): ITokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as ITokenPayload;
};
