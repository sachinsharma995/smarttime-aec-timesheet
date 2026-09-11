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

const router = express.Router();

router.use(protect);
router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);
router.patch("/:id/members/add", addProjectMember);
router.patch("/:id/members/remove", removeProjectMember);

export default router;
