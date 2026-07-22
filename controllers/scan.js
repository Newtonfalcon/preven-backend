import { GoogleGenAI } from "@google/genai/node"
import VisualLog from '../models/visualLog.js'

import "dotenv/config"

const apikey = process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: apikey })

export const scan = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "missing image payload file."
      })
    }

    const imageBuffer = req.file.buffer;
    const userNotes = req.body.notes || "No extra history provided.";
    const targetUserId = req.userId
    const structuredPrompt = `
          You are the specialized computer vision and text translation layer for Preven.
          Analyze this user-uploaded skin tracking image.

          CRITICAL PROCESSING STEP:
          1. Search the image framework to isolate a structural tracking anchor or reference comparison indicator (like a coin, skin marker edge, or a standard 1cm placeholder).
          2. Using that anchor, evaluate the relative mathematical dimensions of the main anomaly marker.
          3. Calculate the shape alignment across both horizontal and vertical axes to score structural asymmetry.

          User Note Context: "${userNotes}"

          Generate a clean consumer observation tracking summary. Never output direct, definitive medical diagnostic declarations. Focus strictly on explaining visual shifts and structural trends.
        `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        structuredPrompt,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: req.file.mimetype
          }
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            asymmetryScore: {
              type: 'NUMBER',
              description: 'Calculated asymmetry from 0.0 (perfectly symmetric) to 1.0 (highly irregular layout)'
            },
            borderProfile: {
              type: 'STRING',
              description: 'Structural classification boundary description: e.g., Smooth, Blurred, or Highly Irregular'
            },
            estimatedDiameterMm: {
              type: 'NUMBER',
              description: 'Approximated comparative dimensional width scale isolated via visual anchor comparison'
            },
            summaryMarkdown: {
              type: 'STRING',
              description: 'Rich text markdown format describing structural trends, texture tracking, and change observations.'
            },
            trackingStatus: {
              type: 'STRING',
              description: 'Short status tag conclusion, e.g., "Stable Baseline" or "Review Flagged"'
            }

          },
          required: ['asymmetryScore', 'borderProfile', 'estimatedDiameterMm', 'summaryMarkdown', 'trackingStatus']

        }
      }
    });

    const evaluationPayload = JSON.parse(response?.text)



    const savedLog = await VisualLog.create({
          userId: targetUserId,
          metrics: {
            asymmetryScore: evaluationPayload.asymmetryScore,
            borderProfile: evaluationPayload.borderProfile,
            estimatedDiameterMm: evaluationPayload.estimatedDiameterMm
          },
          summaryMarkdown: evaluationPayload.summaryMarkdown,
          trackingStatus: evaluationPayload.trackingStatus,
          userNotes: userNotes
        });



    res.json({
      success: true,
      logId: savedLog._id,
      data: evaluationPayload
    })

  } catch (error) {
    console.error('Server pipeline exception:', error);
        res.status(500).json({ error: 'Failed to process visual tracking matrix safely.' });


  }
}


// ------------------------------ ---------- ----- ----
// a quick seperation if not omo
//----------------------      ------

// GET /api/visual-log/:id
export const getVisualLogById = async (req, res) => {
  try {
    const log = await VisualLog.findOne({
      _id: req.params.id,
      userId: req.userId // Security check: user can only view their own logs
    });

    if (!log) {
      return res.status(404).json({ error: "Tracking record not found" });
    }

    return res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error("Fetch log error:", error);
    return res.status(500).json({ error: "Failed to retrieve tracking log" });
  }
};