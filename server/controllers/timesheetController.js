import mongoose from "mongoose";
import Project from "../models/Project.js";
import Timesheet from "../models/Timesheet.js";

const editableStatuses = ["draft", "rejected"];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getDurationInHours = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return 0;
  }

  const duration = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);
  return duration > 0 ? Math.round(duration * 100) / 100 : 0;
};

const populateAvailableReferences = (query) => {
  if (mongoose.models.Project) {
    query.populate("project");
  }
  if (mongoose.models.Task) {
    query.populate("task");
  }
  return query;
};

const getTimesheetForUser = (id, userId) => {
  if (!isValidId(id)) {
    return null;
  }

  return populateAvailableReferences(
    Timesheet.findOne({ _id: id, user: userId }),
  );
};

const getTimesheetFields = (body, existingTimesheet) => {
  const fields = {};
  const allowedFields = [
    "date",
    "description",
    "startTime",
    "endTime",
    "duration",
    "project",
    "task",
  ];

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      fields[field] = body[field];
    }
  });

  const startTime = fields.startTime || existingTimesheet.startTime;
  const endTime = fields.endTime || existingTimesheet.endTime;

  if (startTime && endTime) {
    fields.duration = getDurationInHours(startTime, endTime);
  }

  return fields;
};

const getManagedProjectIds = async (user) => {
  const projects = await Project.find({
    $or: [{ createdBy: user._id }, { members: user._id }],
  }).select("_id");
  return projects.map((project) => project._id);
};

const getPendingTimesheetQuery = async (user, id = null) => {
  const projectIds = await getManagedProjectIds(user);
  const query = {
    status: "submitted",
    project: { $in: projectIds },
  };
  if (id) query._id = id;
  return query;
};

const populateReviewTimesheet = (query) =>
  query
    .populate("user", "name email")
    .populate("project", "name")
    .populate("task", "title");

const ensureManager = (req, res) => {
  if (req.user?.role !== "manager") {
    res.status(403).json({
      success: false,
      message: "Only managers can review timesheets",
    });
    return false;
  }
  return true;
};

export const createTimesheet = async (req, res) => {
  try {
    const { date, description, startTime, endTime, duration, project, task } =
      req.body;

    if (!date || Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({
        success: false,
        message: "A valid date is required",
      });
    }

    const calculatedDuration =
      startTime && endTime
        ? getDurationInHours(startTime, endTime)
        : Number(duration) || 0;
    const timesheet = await Timesheet.create({
      user: req.user._id,
      date,
      description,
      startTime,
      endTime,
      project: project || null,
      task: task || null,
      duration: calculatedDuration,
    });

    return res.status(201).json({ success: true, timesheet });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create timesheet",
    });
  }
};

export const getMyTimesheets = async (req, res) => {
  try {
    const timesheets = await populateAvailableReferences(
      Timesheet.find({ user: req.user._id }).sort({ createdAt: -1 }),
    );

    return res.json({ success: true, timesheets });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch timesheets",
    });
  }
};

export const getTimesheetById = async (req, res) => {
  try {
    const timesheet = await getTimesheetForUser(req.params.id, req.user._id);

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: "Timesheet not found",
      });
    }

    return res.json({ success: true, timesheet });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch timesheet",
    });
  }
};

export const updateTimesheet = async (req, res) => {
  try {
    const timesheet = await getTimesheetForUser(req.params.id, req.user._id);

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: "Timesheet not found",
      });
    }

    if (!editableStatuses.includes(timesheet.status)) {
      return res.status(403).json({
        success: false,
        message: "Only draft or rejected timesheets can be edited",
      });
    }

    Object.assign(timesheet, getTimesheetFields(req.body, timesheet));
    if (timesheet.status === "rejected") {
      timesheet.status = "draft";
      timesheet.managerComment = "";
      timesheet.reviewedBy = null;
      timesheet.reviewedAt = null;
      timesheet.submittedAt = null;
    }
    await timesheet.save();

    return res.json({ success: true, timesheet });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update timesheet",
    });
  }
};

export const deleteTimesheet = async (req, res) => {
  try {
    const timesheet = await getTimesheetForUser(req.params.id, req.user._id);

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: "Timesheet not found",
      });
    }

    if (!editableStatuses.includes(timesheet.status)) {
      return res.status(403).json({
        success: false,
        message: "Only draft or rejected timesheets can be deleted",
      });
    }

    await timesheet.deleteOne();
    return res.json({
      success: true,
      message: "Timesheet deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to delete timesheet",
    });
  }
};

export const submitTimesheet = async (req, res) => {
  try {
    const timesheet = await getTimesheetForUser(req.params.id, req.user._id);

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: "Timesheet not found",
      });
    }

    if (timesheet.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft timesheets can be submitted",
      });
    }

    timesheet.status = "submitted";
    timesheet.submittedAt = new Date();
    await timesheet.save();
    return res.json({ success: true, timesheet });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to submit timesheet",
    });
  }
};

export const startTimer = async (req, res) => {
  try {
    const activeTimesheet = await Timesheet.findOne({
      user: req.user._id,
      status: "draft",
      startTime: { $exists: true, $ne: null },
      $or: [{ endTime: { $exists: false } }, { endTime: null }],
    });

    if (activeTimesheet) {
      return res.status(409).json({
        success: false,
        message: "You already have an active timer",
        timesheet: activeTimesheet,
      });
    }

    const now = new Date();
    const timesheet = await Timesheet.create({
      user: req.user._id,
      date: now,
      startTime: now,
      duration: 0,
      status: "draft",
    });

    return res.status(201).json({ success: true, timesheet });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to start timer",
    });
  }
};

export const stopTimer = async (req, res) => {
  try {
    const timesheet = await Timesheet.findOne({
      user: req.user._id,
      status: "draft",
      startTime: { $exists: true, $ne: null },
      $or: [{ endTime: { $exists: false } }, { endTime: null }],
    });

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: "No active timer found",
      });
    }

    timesheet.endTime = new Date();
    timesheet.duration = getDurationInHours(
      timesheet.startTime,
      timesheet.endTime,
    );
    await timesheet.save();

    return res.json({ success: true, timesheet });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to stop timer",
    });
  }
};

export const getPendingTimesheets = async (req, res) => {
  if (!ensureManager(req, res)) return;

  try {
    const pendingQuery = await getPendingTimesheetQuery(req.user);
    const projectIds = pendingQuery.project.$in;
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);

    const [timesheets, approvedThisWeek, rejectedThisWeek] = await Promise.all([
      populateReviewTimesheet(
        Timesheet.find(pendingQuery).sort({ createdAt: -1 }),
      ),
      Timesheet.countDocuments({
        project: { $in: projectIds },
        status: "approved",
        reviewedAt: { $gte: startOfWeek },
      }),
      Timesheet.countDocuments({
        project: { $in: projectIds },
        status: "rejected",
        reviewedAt: { $gte: startOfWeek },
      }),
    ]);

    return res.json({
      success: true,
      timesheets,
      summary: {
        pendingApproval: timesheets.length,
        totalHoursPending:
          Math.round(
            timesheets.reduce(
              (total, timesheet) => total + (timesheet.duration || 0),
              0,
            ) * 100,
          ) / 100,
        approvedThisWeek,
        rejectedThisWeek,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch pending timesheets",
    });
  }
};

export const approveTimesheet = async (req, res) => {
  if (!ensureManager(req, res)) return;

  try {
    const timesheet = await populateReviewTimesheet(
      Timesheet.findOne(
        await getPendingTimesheetQuery(req.user, req.params.id),
      ),
    );
    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: "Submitted timesheet not found or not available for review",
      });
    }

    timesheet.status = "approved";
    timesheet.reviewedBy = req.user._id;
    timesheet.reviewedAt = new Date();
    timesheet.managerComment = "";
    await timesheet.save();
    return res.json({ success: true, timesheet });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to approve timesheet",
    });
  }
};

export const rejectTimesheet = async (req, res) => {
  if (!ensureManager(req, res)) return;

  const managerComment = req.body.managerComment?.trim();
  if (!managerComment) {
    return res.status(400).json({
      success: false,
      message: "A rejection comment is required",
    });
  }

  try {
    const timesheet = await populateReviewTimesheet(
      Timesheet.findOne(
        await getPendingTimesheetQuery(req.user, req.params.id),
      ),
    );
    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: "Submitted timesheet not found or not available for review",
      });
    }

    timesheet.status = "rejected";
    timesheet.reviewedBy = req.user._id;
    timesheet.reviewedAt = new Date();
    timesheet.managerComment = managerComment;
    await timesheet.save();
    return res.json({ success: true, timesheet });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to reject timesheet",
    });
  }
};
