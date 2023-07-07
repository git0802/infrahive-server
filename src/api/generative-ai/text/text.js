const express = require("express");
const router = express.Router();
const {OpenAi , Anthropic , Cohere, Code}  = require("../../../controllers/generative-ai/text/textController");
const  asyncHandler  =  require("../../../middlewares/asyncErrorHandler");

router.post("/text/openai", asyncHandler(OpenAi))
router.post("/text/anthropic", asyncHandler(Anthropic))
router.post("/text/cohere", asyncHandler(Cohere)) 
router.post("/text/code", asyncHandler(Code)) 

module.exports =  router;