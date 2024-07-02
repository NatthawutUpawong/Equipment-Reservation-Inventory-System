const multer = require("multer");
const path = require('path')


//set upload directory and rename upload file with timestamp
const storageOption = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/assets/')
    },
    filename: function (req, file, cb) {
        //rename file with timestamp as prefix
        // cb(null, Date.now() + "_" + file.originalname);
        // to get only file extension -> path.extname(file.originalname)
        // to get only filename -> path.basename(fileName, path.extname(file.originalname))
        const renamedFileName = Date.now() + "_" + file.originalname;
        cb(null, renamedFileName);
    }
});

// set upload option and input fieldname
const upload = multer({ storage: storageOption }).single("filetoupload");

module.exports = upload;