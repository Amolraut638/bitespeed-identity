import express from "express";
import dotenv from "dotenv";
import identifyRouter from "./routes/identify.route";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/identify", identifyRouter);

export default app;