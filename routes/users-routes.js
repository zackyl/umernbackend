import { Router } from "express";
import {
  getAllUsers,
  createUser,
  loginUser,
} from "../controllers/users-controller.js";
import { body } from "express-validator";
import fileUpload from "../middleware/file-upload.js";

const router = Router();

router.get("/", getAllUsers);
router.post(
  "/signup",
  fileUpload.single("image"),
  [
    body("name").notEmpty(),
    body("email").normalizeEmail().isEmail(),
    body("password").isLength({ min: 6 }),
  ],
  createUser
);
router.post("/login", loginUser);

export default router;
