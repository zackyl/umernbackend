import jwt from "jsonwebtoken";
import HttpError from "../models/http-error.js";

export default (req, res, next) => {
  console.log("check auth!!!");
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    // catches if authorization header not set
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      // checks if token is null
      throw new Error("authentication failed!");
    }
    const decodedtoken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { userId: decodedtoken.userId };
    next();
  } catch (err) {
    const error = new HttpError("Authentication failed", 403);
    return next(error);
  }
};
