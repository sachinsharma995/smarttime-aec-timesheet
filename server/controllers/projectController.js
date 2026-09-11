import mongoose from "mongoose";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Timesheet from "../models/Timesheet.js";
import User from "../models/User.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const canAccessProject = (project, user) =>
  user.role === "manager" ||
  project.members.some((member) => member.toString() === user._id.toString());

const canManageProject = (project, user) =>
  user.role === "manager" ||
  project.createdBy.toString() === user._id.toString();

const populateProject = (query) =>
  query
    .populate("members", "name email role")
    .populate("createdBy", "name email role");

const accessibleQuery = (user) =>
  user.role === "manager"
    ? { $or: [{ createdBy: user._id }, { members: user._id }] }
    : { members: user._id };

export const createProject = async (req, res) => {
  try {
    const { name, description, client, startDate, endDate, status } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Project name is required" });
    }
    const project = await Project.create({
      name: name.trim(),
      description,
      client,
      startDate,
      endDate,
      status,
      createdBy: req.user._id,
      members: [req.user._id],
    });
    return res
      .status(201)
      .json({
        success: true,
        project: await populateProject(Project.findById(project._id)),
      });
  } catch (error) {
    return res
      .status(400)
      .json({
        success: false,
        message: error.message || "Unable to create project",
      });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await populateProject(
      Project.find(accessibleQuery(req.user)).sort({ createdAt: -1 }),
    );
    return res.json({ success: true, projects });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch projects" });
  }
};

export const getProjectById = async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    const project = await populateProject(
      Project.findOne({ _id: req.params.id, ...accessibleQuery(req.user) }),
    );
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    return res.json({ success: true, project });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch project" });
  }
};

export const updateProject = async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    const project = await Project.findById(req.params.id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    if (!canManageProject(project, req.user))
      return res
        .status(403)
        .json({ success: false, message: "You cannot update this project" });
    ["name", "description", "client", "startDate", "endDate", "status"].forEach(
      (field) => {
        if (req.body[field] !== undefined) project[field] = req.body[field];
      },
    );
    if (typeof project.name !== "string" || !project.name.trim())
      return res
        .status(400)
        .json({ success: false, message: "Project name is required" });
    project.name = project.name.trim();
    await project.save();
    return res.json({
      success: true,
      project: await populateProject(Project.findById(project._id)),
    });
  } catch (error) {
    return res
      .status(400)
      .json({
        success: false,
        message: error.message || "Unable to update project",
      });
  }
};

export const deleteProject = async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    const project = await Project.findById(req.params.id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    if (!canManageProject(project, req.user))
      return res
        .status(403)
        .json({ success: false, message: "You cannot delete this project" });
    const [taskExists, timesheetExists] = await Promise.all([
      Task.exists({ project: project._id }),
      Timesheet.exists({ project: project._id }),
    ]);
    if (taskExists || timesheetExists)
      return res
        .status(409)
        .json({
          success: false,
          message:
            "This project cannot be deleted while it has tasks or timesheets",
        });
    await project.deleteOne();
    return res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Unable to delete project" });
  }
};

export const addProjectMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    if (!canManageProject(project, req.user))
      return res
        .status(403)
        .json({ success: false, message: "You cannot manage this project" });
    let memberId = req.body.userId;
    if (!memberId && req.body.email) {
      const member = await User.findOne({
        email: req.body.email.trim().toLowerCase(),
      });
      memberId = member?._id;
    }
    if (!memberId || !isValidId(memberId))
      return res
        .status(400)
        .json({
          success: false,
          message: "A valid user ID or email is required",
        });
    if (!(await User.exists({ _id: memberId })))
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (
      project.members.some(
        (member) => member.toString() === memberId.toString(),
      )
    )
      return res
        .status(409)
        .json({ success: false, message: "User is already a project member" });
    project.members.push(memberId);
    await project.save();
    return res.json({
      success: true,
      project: await populateProject(Project.findById(project._id)),
    });
  } catch (error) {
    return res
      .status(400)
      .json({
        success: false,
        message: error.message || "Unable to add project member",
      });
  }
};

export const removeProjectMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    if (!canManageProject(project, req.user))
      return res
        .status(403)
        .json({ success: false, message: "You cannot manage this project" });
    const { userId } = req.body;
    if (!userId || !isValidId(userId))
      return res
        .status(400)
        .json({ success: false, message: "A valid user ID is required" });
    if (userId.toString() === project.createdBy.toString())
      return res
        .status(400)
        .json({
          success: false,
          message: "The project creator must remain a member",
        });
    project.members = project.members.filter(
      (member) => member.toString() !== userId.toString(),
    );
    await project.save();
    return res.json({
      success: true,
      project: await populateProject(Project.findById(project._id)),
    });
  } catch (error) {
    return res
      .status(400)
      .json({
        success: false,
        message: error.message || "Unable to remove project member",
      });
  }
};
