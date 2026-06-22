import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  username?: string | null;
  email: string;
  password: string;
  createdAt: Date;
}

const UserSchema = new Schema(
  {
    username: { type: String, default: null },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
