import express from "express";
import {
  createTimesheet,
  deleteTimesheet,
  getMyTimesheets,
  getPendingTimesheets,
  getTimesheetById,
  approveTimesheet,
  rejectTimesheet,
  startTimer,
  stopTimer,
  submitTimesheet,
  updateTimesheet,
} from "../controllers/timesheetController.js";
import protect from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/timer/start", startTimer);
router.post("/timer/stop", stopTimer);
router.get("/pending", requireRole("manager"), getPendingTimesheets);
router.patch("/:id/approve", requireRole("manager"), approveTimesheet);
router.patch("/:id/reject", requireRole("manager"), rejectTimesheet);
router.post("/", createTimesheet);
router.get("/", getMyTimesheets);
router.get("/:id", getTimesheetById);
router.put("/:id", updateTimesheet);
router.delete("/:id", deleteTimesheet);
router.patch("/:id/submit", submitTimesheet);

export default router;
