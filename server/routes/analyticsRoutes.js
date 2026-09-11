import express from "express";
import {
  getDashboardStats,
  getManagerStats,
  getProjectHours,
  getTaskStats,
  getWeeklyHours,
} from "../controllers/analyticsController.js";
import protect from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/dashboard", getDashboardStats);
router.get("/weekly-hours", getWeeklyHours);
router.get("/project-hours", getProjectHours);
router.get("/task-stats", getTaskStats);
router.get("/manager", requireRole("manager"), getManagerStats);

export default router;
