const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const attendanceRoutes = require("./routes/attendanceRoutes");
const adminRoutes = require("./routes/adminRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const authRoutes = require("./routes/authRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const leaveTypeRoutes = require("./routes/leaveTypeRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const auditRoutes = require("./routes/auditRoutes");

const notFound = require("./middleware/notFoundMiddleware");
const errorHandler = require("./middleware/errorMiddleware");

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://work-trac.vercel.app']   // Replace with your actual Vercel URL
  : ['http://localhost:3000', 'http://localhost:5173'];

const app = express();

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser()); // ✅ Parse cookies

app.get("/", (req, res) => res.send("WorkTrac API is running"));

app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/leavetypes", leaveTypeRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin/audit", auditRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
