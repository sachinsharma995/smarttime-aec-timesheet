import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const createTimesheet = (timesheet) =>
  api.post("/timesheets", timesheet);

export const getMyTimesheets = () => api.get("/timesheets");

export const getTimesheetById = (id) => api.get(`/timesheets/${id}`);

export const updateTimesheet = (id, timesheet) =>
  api.put(`/timesheets/${id}`, timesheet);

export const deleteTimesheet = (id) => api.delete(`/timesheets/${id}`);

export const submitTimesheet = (id) => api.patch(`/timesheets/${id}/submit`);

export const getPendingTimesheets = () => api.get("/timesheets/pending");

export const approveTimesheet = (id) => api.patch(`/timesheets/${id}/approve`);

export const rejectTimesheet = (id, managerComment) =>
  api.patch(`/timesheets/${id}/reject`, { managerComment });

export const startTimer = () => api.post("/timesheets/timer/start");

export const stopTimer = () => api.post("/timesheets/timer/stop");

export const createProject = (project) => api.post("/projects", project);

export const getProjects = () => api.get("/projects");

export const getProjectById = (id) => api.get(`/projects/${id}`);

export const updateProject = (id, project) =>
  api.put(`/projects/${id}`, project);

export const deleteProject = (id) => api.delete(`/projects/${id}`);

export const addProjectMember = (id, member) =>
  api.patch(`/projects/${id}/members/add`, member);

export const removeProjectMember = (id, userId) =>
  api.patch(`/projects/${id}/members/remove`, { userId });

export const createTask = (task) => api.post("/tasks", task);

export const getTasks = (filters = {}) =>
  api.get("/tasks", { params: filters });

export const getTaskById = (id) => api.get(`/tasks/${id}`);

export const updateTask = (id, task) => api.put(`/tasks/${id}`, task);

export const deleteTask = (id) => api.delete(`/tasks/${id}`);

export const getDashboardStats = () => api.get("/analytics/dashboard");

export const getWeeklyHours = () => api.get("/analytics/weekly-hours");

export const getProjectHours = () => api.get("/analytics/project-hours");

export const getTaskStats = () => api.get("/analytics/task-stats");

export const getManagerStats = () => api.get("/analytics/manager");

export const generateAITimesheet = (workDescription) =>
  api.post("/ai/timesheet", { workDescription });

export const getAIWeeklySummary = () => api.get("/ai/weekly-summary");

export default api;
