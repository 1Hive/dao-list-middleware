import express from "express";
const app = express();

import { catchAsync } from "./utils/catchAsync.js";

import * as daolist from "./routes/daolist.js";

app.use(express.json());

app.get("/", (req, res) => {
  res.send("1.0.0");
});

app.get("/v1/dao", catchAsync(daolist.getLatestCommitRoute));
app.post("/v1/dao", catchAsync(daolist.postCreateTreeRoute));

export default app;