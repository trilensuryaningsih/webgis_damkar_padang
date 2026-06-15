const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  }),
);
app.use(express.json());

// Routes
app.use("/api/damkar", require("./routes/damkar"));
app.use("/api/coverage", require("./routes/coverage"));
app.use("/api/blankspot", require("./routes/blankspot"));
app.use("/api/rekomendasi", require("./routes/rekomendasi"));
app.use("/api/jalan", require("./routes/jalan"));
app.use("/api/stats", require("./routes/stats"));

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "✅ WebGIS Damkar Padang API berjalan!",
    endpoints: [
      "/api/damkar",
      "/api/coverage",
      "/api/blankspot",
      "/api/rekomendasi",
      "/api/jalan",
      "/api/stats",
    ],
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🗄️  Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`,
  );
});
