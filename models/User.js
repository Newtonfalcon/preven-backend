import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    default: "",
  },
  lastName: {
    type: String,
    default: "",
  },
  imageUrl: {
    type: String,
    default: "",
  },
  profileStatus: {
    type: String,
    default: "Active Baseline Tracker",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model('User', UserSchema);
