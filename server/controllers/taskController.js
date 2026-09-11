import mongoose from "mongoose";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const canAccessProject = (project, user) =>
  user.role === "manager" ||
  project.createdBy.toString() === user._id.toString() ||
  project.members.some((member) => member.toString() === user._id.toString());

const canManageTask = (task, project, user) =>
  user.role === "manager" ||
  project.createdBy.toString() === user._id.toString() ||
  task.createdBy.toString() === user._id.toString();

const populateTask = (query) =>
  query
    .populate("project", "name client status")
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role");

const getAccessibleProjects = (user) => {
  const query =
    user.role === "manager"
      ? { $or: [{ createdBy: user._id }, { members: user._id }] }
      : { members: user._id };
  return Project.find(query).select("_id");
};

const getProjectForUser = async (projectId, user) => {
  if (!isValidId(projectId)) return null;
  const project = await Project.findById(projectId);
  return project && canAccessProject(project, user) ? project : null;
};

export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      project: projectId,
      assignedTo,
      priority,
      status,
      dueDate,
    } = req.body;
    if (typeof title !== "string" || !title.trim())
      return res
        .status(400)
        .json({ success: false, message: "Task title is required" });
    const project = await getProjectForUser(projectId, req.user);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Accessible project not found" });
    if (
      assignedTo &&
      (!(await User.exists({ _id: assignedTo })) ||
        !project.members.some(
          (member) => member.toString() === assignedTo.toString(),
        ))
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Assigned user must be a project member",
        });
    }
    const task = await Task.create({
      title: title.trim(),
      description,
      project: project._id,
      assignedTo: assignedTo || null,
      priority,
      status,
      dueDate,
      createdBy: req.user._id,
    });
    return res
      .status(201)
      .json({
        success: true,
        task: await populateTask(Task.findById(task._id)),
      });
  } catch (error) {
    return res
      .status(400)
      .json({
        success: false,
        message: error.message || "Unable to create task",
      });
  }
};

export const getTasks = async (req, res) => {
  try {
    const projects = await getAccessibleProjects(req.user);
    const projectIds = projects.map((project) => project._id);
    const query = { project: { $in: projectIds } };
    if (req.query.project)
      query.project = isValidId(req.query.project) ? req.query.project : null;
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    const tasks = await populateTask(Task.find(query).sort({ createdAt: -1 }));
    return res.json({ success: true, tasks });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch tasks" });
  }
};

export const getTaskById = async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    const task = await populateTask(Task.findById(req.params.id));
    if (
      !task ||
      !task.project ||
      !(await getProjectForUser(task.project._id, req.user))
    )
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    return res.json({ success: true, task });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch task" });
  }
};

export const updateTask = async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    const task = await Task.findById(req.params.id);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    const project = await Project.findById(task.project);
    if (!project || !canAccessProject(project, req.user))
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    if (
      !canManageTask(task, project, req.user) &&
      (!task.assignedTo ||
        task.assignedTo.toString() !== req.user._id.toString())
    )
      return res
        .status(403)
        .json({ success: false, message: "You cannot update this task" });
    [
      "title",
      "description",
      "priority",
      "status",
      "assignedTo",
      "dueDate",
    ].forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });
    if (
      req.body.assignedTo &&
      !project.members.some(
        (member) => member.toString() === req.body.assignedTo.toString(),
      )
    )
      return res
        .status(400)
        .json({
          success: false,
          message: "Assigned user must be a project member",
        });
    await task.save();
    return res.json({
      success: true,
      task: await populateTask(Task.findById(task._id)),
    });
  } catch (error) {
    return res
      .status(400)
      .json({
        success: false,
        message: error.message || "Unable to update task",
      });
  }
};

export const deleteTask = async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    const task = await Task.findById(req.params.id);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    const project = await Project.findById(task.project);
    if (!project || !canAccessProject(project, req.user))
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    if (!canManageTask(task, project, req.user))
      return res
        .status(403)
        .json({ success: false, message: "You cannot delete this task" });
    await task.deleteOne();
    return res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Unable to delete task" });
  }
};
