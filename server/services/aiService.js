import { GoogleGenAI } from "@google/genai";

const defaultModel = "gemini-2.5-flash";

const timesheetSchema = {
  type: "object",
  properties: {
    project: { type: "string" },
    task: { type: "string" },
    category: { type: "string" },
    description: { type: "string" },
    estimatedHours: { type: "number" },
  },
  required: ["project", "task", "category", "description", "estimatedHours"],
};

const weeklySummarySchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    highlights: { type: "array", items: { type: "string" } },
    totalHours: { type: "number" },
    topProjects: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: [
    "summary",
    "highlights",
    "totalHours",
    "topProjects",
    "recommendations",
  ],
};

const getAIClient = () => {
  if (!process.env.AI_API_KEY) {
    const error = new Error("AI service is temporarily unavailable");
    error.statusCode = 503;
    throw error;
  }

  return new GoogleGenAI({ apiKey: process.env.AI_API_KEY });
};

const parseJsonContent = (content) => {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    const error = new Error("AI returned an invalid response");
    error.statusCode = 502;
    throw error;
  }
};

const requestJson = async (systemInstruction, prompt, responseJsonSchema) => {
  const ai = getAIClient();
  const model = process.env.AI_MODEL || defaultModel;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseJsonSchema,
      },
    });

    if (typeof response.text !== "string" || !response.text.trim()) {
      const error = new Error("AI returned an empty response");
      error.statusCode = 502;
      throw error;
    }

    return parseJsonContent(response.text);
  } catch (error) {
    if (error.statusCode) throw error;

    const status = error.status || error.code;
    const message = String(error.message || "").toLowerCase();
    const serviceError = new Error(
      status === 429 || message.includes("quota") || message.includes("rate")
        ? "AI service is temporarily unavailable"
        : "AI service request failed",
    );
    serviceError.statusCode = status === 429 ? 503 : 502;
    throw serviceError;
  }
};

export const generateTimesheetEntry = async (workDescription) => {
  const result = await requestJson(
    "You structure work descriptions for a timesheet. Return only JSON matching the provided schema. Never invent project or task IDs. Suggest project and task names only when the description supports them. estimatedHours must be a non-negative number.",
    `Structure this work description without inventing facts or IDs:\n\n${workDescription}`,
    timesheetSchema,
  );

  return {
    project: typeof result.project === "string" ? result.project.trim() : "",
    task: typeof result.task === "string" ? result.task.trim() : "",
    category: typeof result.category === "string" ? result.category.trim() : "",
    description:
      typeof result.description === "string"
        ? result.description.trim()
        : workDescription,
    estimatedHours: Number.isFinite(Number(result.estimatedHours))
      ? Math.max(0, Number(result.estimatedHours))
      : 0,
  };
};

export const generateWeeklySummary = async (timesheets) => {
  const result = await requestJson(
    "You summarize a user's weekly work. Return only JSON matching the provided schema. Use only the supplied data. Highlights and recommendations must be concise strings. Do not infer private or unrelated information.",
    `Summarize this user's current-week work data. Do not mention data that is not present:\n\n${JSON.stringify(timesheets)}`,
    weeklySummarySchema,
  );

  return {
    summary: typeof result.summary === "string" ? result.summary.trim() : "",
    highlights: Array.isArray(result.highlights)
      ? result.highlights.filter((item) => typeof item === "string")
      : [],
    totalHours: Number.isFinite(Number(result.totalHours))
      ? Math.max(0, Number(result.totalHours))
      : 0,
    topProjects: Array.isArray(result.topProjects)
      ? result.topProjects.filter((item) => typeof item === "string")
      : [],
    recommendations: Array.isArray(result.recommendations)
      ? result.recommendations.filter((item) => typeof item === "string")
      : [],
  };
};
