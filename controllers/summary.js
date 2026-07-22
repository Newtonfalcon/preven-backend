import VisualLog from '../models/visualLog.js';
import SummaryCache from '../models/summary.js';
import { summarizeText } from '../utils/summarizer.js';

export const getUserLongitudinalSummary = async (req, res) => {
  try {
    const targetUserId = req.userId;

    // 1. Fetch all log IDs for this user sorted chronologically
    const logs = await VisualLog.find({ userId: targetUserId })
      .select('_id metrics trackingStatus summaryMarkdown createdAt')
      .sort({ createdAt: 1 })
      .lean();

    if (!logs || logs.length === 0) {
      return res.status(404).json({ error: 'No visual logs found to summarize.' });
    }

    // 2. Generate a unique cache key signature based on the log IDs
    // Example: "669a10f_669a11a_669a12c"
    const logIdsList = logs.map((log) => log._id.toString());
    const cacheKey = logIdsList.join('_');

    // 3. CHECK CACHE: Search MongoDB for an existing summary matching this exact cache key
    const cachedSummary = await SummaryCache.findOne({
      userId: targetUserId,
      cacheKey: cacheKey,
    });

    if (cachedSummary) {
      console.log('⚡ Serving summary from MongoDB cache (Groq skipped)');
      return res.status(200).json({
        success: true,
        cached: true,
        data: cachedSummary.report,
      });
    }

    // 4. CACHE MISS: Pre-summarize logs into a lightweight payload for Groq
    const preSummarizedArray = logs.map((log, index) => ({
      entryNumber: index + 1,
      date: new Date(log.createdAt).toISOString().split('T')[0],
      status: log.trackingStatus,
      asymmetryScore: log.metrics?.asymmetryScore,
      diameterMm: log.metrics?.estimatedDiameterMm,
      individualSummary: log.summaryMarkdown,
    }));

    const promptPayload = `
You are analyzing a sequence of ${preSummarizedArray.length} historical visual health logs for a single user.

LOG DATA ARRAY:
${JSON.stringify(preSummarizedArray, null, 2)}

TASK:
Analyze all the entries together and synthesize them into ONE consolidated progress report.
Return strictly JSON matching this structure:
{
  "totalLogsAnalyzed": ${preSummarizedArray.length},
  "overallTrendStatus": "string (e.g. Stable Baseline, Minor Shift, Flagged)",
  "executiveSummary": "string (2-3 concise sentences summarizing trends across all entries)",
  "keyObservations": ["bullet 1", "bullet 2"],
  "recommendedNextSteps": ["step 1", "step 2"]
}
`;

    // 5. Call Groq LLM
    console.log('🤖 Generating fresh summary with Groq...');
    const summaryResult = await summarizeText(promptPayload);

    // 6. SAVE TO DB CACHE for future requests
    await SummaryCache.create({
      userId: targetUserId,
      logIds: logIdsList,
      cacheKey: cacheKey,
      report: summaryResult,
    });

    return res.status(200).json({
      success: true,
      cached: false,
      data: summaryResult,
    });
  } catch (error) {
    console.error('Longitudinal Summary Error:', error);
    return res.status(500).json({
      error: 'Failed to generate longitudinal summary.',
    });
  }
};