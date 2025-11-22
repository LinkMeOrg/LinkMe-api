const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const contactMessageRoutes = require("./routes/contactMessageRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const smartCardRoutes = require("./routes/index");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration for multiple frontends (client + dashboard)
const allowedOrigins = [
  "http://localhost:5173", // Local client
  "http://localhost:5174", // Local dashboard (if different port)
  process.env.CLIENT_URL, // Production client
  process.env.DASHBOARD_URL, // Production dashboard
].filter(Boolean); // Remove undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api", contactMessageRoutes);
app.use("/api", smartCardRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
