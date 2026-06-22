import { Schema, model, models } from 'mongoose';

export interface ISigninAttempt {
  email: string;
  userId?: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  error?: string;
  createdAt?: Date;
}

const SigninAttemptSchema = new Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  userId: { type: String },
  success: { type: Boolean, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  error: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const SigninAttempt = models.SigninAttempt || model('SigninAttempt', SigninAttemptSchema);

export default SigninAttempt;
