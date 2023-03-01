import fs from "fs";
import express from "express";
import bodyParse from "body-parser";
import placeRoutes from "./routes/places-routes.js";
import HttpError from "./models/http-error.js";
import userRoutes from "./routes/users-routes.js";
import mongoose from "mongoose";
import path from "path";

const URL =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.chbzsjr.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();

app.use(bodyParse.json());

app.use("/uploads/images", express.static(path.join('uploads', 'images')));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/places", placeRoutes); // => /api/places
app.use("/api/users", userRoutes); // => /api/user

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  // console.log(res)
  if (req.file) {
    console.log(req.file);
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occured!" });
});

mongoose.set("strictQuery", true);
mongoose
  .connect(URL)
  .then(() => app.listen(5000))
  .catch((err) => {
    console.log(err);
  });
