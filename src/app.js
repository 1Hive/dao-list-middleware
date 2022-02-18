import express from "express";
import cors from "cors";
import busboy from "connect-busboy";
import request from 'request';

const app = express();

import { catchAsync } from "./utils/catchAsync.js";

import * as daolistRoutes from "./routes/daolist.js";
import * as pinataRoutes from "./routes/pinata.js";

app.use(cors());
app.use(
  express.urlencoded({
    extended: true,
    limit: "5mb",
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(busboy());

app.get("/", (req, res) => {
  res.send("1.0.0");
});

app.get("/cors/*", function (req, res) {
  request(req.url.substring(6), {json: true}, (err) => {
    if (err) { return console.log(err); }
  }).pipe(res);
});

app.put("/v1/daoAssets", catchAsync(daolistRoutes.putCreateAssets));
app.post("/v1/dao", catchAsync(daolistRoutes.postCreateTreeRoute));
app.post(
  "/v1/pinata/pinFileToIPFS",
  catchAsync(pinataRoutes.postPinFileToIPFS)
);

export default app;
