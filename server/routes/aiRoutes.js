import express from "express";
import {
  generateTimesheetAI,
  generateWeeklySummaryAI,
} from "../controllers/aiController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/timesheet", generateTimesheetAI);
router.get("/weekly-summary", generateWeeklySummaryAI);

export default router;
