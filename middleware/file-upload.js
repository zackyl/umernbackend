import multer from "multer";
import { v4 as uuid } from "uuid";
import fs from "fs";

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};
const savepath = "uploads/images";

const fileUpload = multer({
  limits: 500000, // 500 kb
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // can also be dest? https://www.npmjs.com/package/multer
      fs.mkdirSync(savepath, { recursive: true });
      cb(null, savepath);
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP[file.mimetype];
      cb(null, uuid() + "." + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error("Invalid mime type!");
    cb(error, isValid);
  },
});

export default fileUpload;
