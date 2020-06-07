//ref : https://medium.com/@joeokpus/uploading-images-to-cloudinary-using-multer-and-expressjs-f0b9a4e14c54

//middleware for the cloudinary config
const { config } = require("cloudinary").v2;

const cloudinaryConfig = (req, res, next) => {
  config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  next();
};

module.exports = { cloudinaryConfig };
