import { body, param, validationResult } from "express-validator";
import { ApiError } from "./ApiError.js";

export const validateHandler = (req, res, next) => {
    const errors = validationResult(req);
  
    const errorMessages = errors
      .array()
      .map((error) => error.msg)
      .join(", ");
  
    if (errors.isEmpty()) return next();
    else next(new ApiError(errorMessages, 400));
  };

 export const newGroupValidator = () => [
    body("name", "Please Enter Name").notEmpty(),
    body("members")
      .notEmpty()
      .withMessage("Please Enter Members")
      .isArray({ min: 2, max: 100 })
      .withMessage("Members must be 2-100"),
  ];
  