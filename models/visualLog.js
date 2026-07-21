import mongoose from 'mongoose';

const VisualLogSchema = new mongoose.Schema({
  // The unique identifier from Clerk to group records per user
  userId: {
    type: String,
    required: true,
    index: true,
  },
  metrics: {
    asymmetryScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    borderProfile: {
      type: String,
      required: true
    },
    estimatedDiameterMm: {
      type: Number,
      required: true
    }
  },
  summaryMarkdown: {
    type: String,
    required: true
  },
  trackingStatus: {
    type: String,
    required: true,
    default: "Stable Baseline"
  },
  userNotes: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('VisualLog', VisualLogSchema);
