import express from "express";
import {
  addProjectMember,
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  removeProjectMember,
  updateProject,
} from "../controllers/projectController.js";
import protect from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/", requireRole("manager"), createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", requireRole("manager"), updateProject);
router.delete("/:id", requireRole("manager"), deleteProject);
router.patch("/:id/members/add", requireRole("manager"), addProjectMember);
router.patch(
  "/:id/members/remove",
  requireRole("manager"),
  removeProjectMember,
);

export default router;
