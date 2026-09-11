import Timesheet from "../models/Timesheet.js";
import {
  generateTimesheetEntry,
  generateWeeklySummary,
} from "../services/aiService.js";

const getWeekStart = () => {
  const start = new Date();
  const day = start.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
};

const getAIErrorMessage = (error) =>
  error.statusCode === 400
    ? error.message
    : "AI service is temporarily unavailable. You can still enter your timesheet manually.";

export const generateTimesheetAI = async (req, res) => {
  const rawDescription = req.body?.workDescription;
  const workDescription =
    typeof rawDescription === "string" ? rawDescription.trim() : "";

  if (!workDescription) {
    return res
      .status(400)
      .json({ success: false, message: "Work description is required" });
  }
  if (workDescription.length > 2000) {
    return res.status(400).json({
      success: false,
      message: "Work description must be 2000 characters or fewer",
    });
  }

  try {
    const result = await generateTimesheetEntry(workDescription);
    return res.json({ success: true, result });
  } catch (error) {
    return res
      .status(error.statusCode || 502)
      .json({ success: false, message: getAIErrorMessage(error) });
  }
};

export const generateWeeklySummaryAI = async (req, res) => {
  try {
    const start = getWeekStart();
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const timesheets = await Timesheet.find({
      user: req.user._id,
      date: { $gte: start, $lt: end },
      status: { $ne: "rejected" },
    })
      .select("date description duration project task status")
      .populate("project", "name")
      .populate("task", "title")
      .sort({ date: 1 });

    const sanitizedTimesheets = timesheets.map((timesheet) => ({
      date: timesheet.date,
      project: timesheet.project?.name || "Unassigned",
      task: timesheet.task?.title || "Unassigned",
      description: timesheet.description || "",
      duration: timesheet.duration || 0,
      status: timesheet.status,
    }));
    const result = await generateWeeklySummary(sanitizedTimesheets);
    return res.json({ success: true, result });
  } catch (error) {
    return res
      .status(error.statusCode || 502)
      .json({ success: false, message: getAIErrorMessage(error) });
  }
};
