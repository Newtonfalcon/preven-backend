import mongoose from 'mongoose';

const summaryCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Array of VisualLog _ids that were included in this summary
    logIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VisualLog',
      },
    ],
    // Unique signature string made from logIds (e.g. "id1_id2_id3")
    cacheKey: {
      type: String,
      required: true,
      index: true,
    },
    // The stored JSON report returned by Groq
    report: {
      totalLogsAnalyzed: Number,
      overallTrendStatus: String,
      executiveSummary: String,
      keyObservations: [String],
      recommendedNextSteps: [String],
    },
  },
  { timestamps: true }
);

export default mongoose.model('SummaryCache', summaryCacheSchema);