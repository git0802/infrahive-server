const express = require("express");
const router = express.Router();
const   {Imgdalle , Imgdream, PromptSubmit, LoadPrompt, PromptCode}  = require("../../../controllers/generative-ai/image/imageController");
const  asyncHandler  =  require("../../../middlewares/asyncErrorHandler");

router.post("/image/dalle", asyncHandler(Imgdalle))
router.post("/image/dream", asyncHandler(Imgdream))
router.post("/image/promptSubmit", asyncHandler(PromptSubmit))
router.post("/image/loadPrompt", asyncHandler(LoadPrompt))
router.post("/image/promptCode", asyncHandler(PromptCode))


module.exports =  router;