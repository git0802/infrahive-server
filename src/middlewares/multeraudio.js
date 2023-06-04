const multer = require("multer")


const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/audio')
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
}).single('file');

module.exports = upload;