import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Timesheet from "../models/Timesheet.js";

const roundHours = (hours) => Math.round((hours || 0) * 100) / 100;

const getWeekStart = () => {
  const start = new Date();
  const day = start.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
};

const getAccessibleProjectQuery = (user) =>
  user.role === "manager"
    ? { $or: [{ createdBy: user._id }, { members: user._id }] }
    : { members: user._id };

const getAccessibleProjects = (user) =>
  Project.find(getAccessibleProjectQuery(user)).select(
    "_id name status members createdBy",
  );

export const getDashboardStats = async (req, res) => {
  try {
    const [
      hoursResult,
      activeProjects,
      totalTasks,
      completedTasks,
      pendingTimesheets,
      approvedTimesheets,
      rejectedTimesheets,
    ] = await Promise.all([
      Timesheet.aggregate([
        { $match: { user: req.user._id, status: { $ne: "rejected" } } },
        { $group: { _id: null, total: { $sum: "$duration" } } },
      ]),
      Project.countDocuments({
        ...getAccessibleProjectQuery(req.user),
        status: "active",
      }),
      Task.countDocuments({ assignedTo: req.user._id }),
      Task.countDocuments({ assignedTo: req.user._id, status: "completed" }),
      Timesheet.countDocuments({ user: req.user._id, status: "submitted" }),
      Timesheet.countDocuments({ user: req.user._id, status: "approved" }),
      Timesheet.countDocuments({ user: req.user._id, status: "rejected" }),
    ]);

    return res.json({
      success: true,
      stats: {
        totalHours: roundHours(hoursResult[0]?.total),
        activeProjects,
        totalTasks,
        completedTasks,
        pendingTimesheets,
        approvedTimesheets,
        rejectedTimesheets,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Unable to calculate dashboard statistics",
      });
  }
};

export const getWeeklyHours = async (req, res) => {
  try {
    const start = getWeekStart();
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const entries = await Timesheet.find({
      user: req.user._id,
      status: { $ne: "rejected" },
      date: { $gte: start, $lt: end },
    }).select("date duration");
    const hours = [0, 0, 0, 0, 0, 0, 0];
    entries.forEach((entry) => {
      const day = new Date(entry.date).getDay();
      const index = day === 0 ? 6 : day - 1;
      hours[index] += entry.duration || 0;
    });
    return res.json({
      success: true,
      weeklyHours: hours.map((value, index) => ({
        day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index],
        hours: roundHours(value),
      })),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Unable to calculate weekly hours" });
  }
};

export const getProjectHours = async (req, res) => {
  try {
    const projectIds = (await getAccessibleProjects(req.user)).map(
      (project) => project._id,
    );
    const projectHours = await Timesheet.aggregate([
      {
        $match: {
          user: req.user._id,
          status: { $ne: "rejected" },
          project: { $in: projectIds },
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "projectDetails",
        },
      },
      {
        $unwind: { path: "$projectDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$project",
          project: {
            $first: { $ifNull: ["$projectDetails.name", "Unassigned"] },
          },
          hours: { $sum: "$duration" },
        },
      },
      { $project: { _id: 0, project: 1, hours: { $round: ["$hours", 2] } } },
      { $sort: { hours: -1 } },
    ]);
    return res.json({ success: true, projectHours });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Unable to calculate project hours" });
  }
};

export const getTaskStats = async (req, res) => {
  try {
    const grouped = await Task.aggregate([
      { $match: { assignedTo: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const stats = { todo: 0, inProgress: 0, completed: 0 };
    grouped.forEach((entry) => {
      if (entry._id === "todo") stats.todo = entry.count;
      if (entry._id === "in-progress") stats.inProgress = entry.count;
      if (entry._id === "completed") stats.completed = entry.count;
    });
    return res.json({ success: true, taskStats: stats });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Unable to calculate task statistics" });
  }
};

export const getManagerStats = async (req, res) => {
  try {
    const projects = await getAccessibleProjects(req.user);
    const projectIds = projects.map((project) => project._id);
    const teamMemberIds = new Set();
    projects.forEach((project) => {
      teamMemberIds.add(project.createdBy.toString());
      project.members.forEach((member) => teamMemberIds.add(member.toString()));
    });

    const [pendingApprovals, hoursResult, activeProjects, completedTasks] =
      await Promise.all([
        Timesheet.countDocuments({
          project: { $in: projectIds },
          status: "submitted",
        }),
        Timesheet.aggregate([
          {
            $match: {
              project: { $in: projectIds },
              status: { $ne: "rejected" },
            },
          },
          { $group: { _id: null, total: { $sum: "$duration" } } },
        ]),
        Project.countDocuments({ _id: { $in: projectIds }, status: "active" }),
        Task.countDocuments({
          project: { $in: projectIds },
          status: "completed",
        }),
      ]);

    return res.json({
      success: true,
      stats: {
        teamMembers: teamMemberIds.size,
        pendingApprovals,
        totalTeamHours: roundHours(hoursResult[0]?.total),
        activeProjects,
        completedTasks,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Unable to calculate manager statistics",
      });
  }
};
