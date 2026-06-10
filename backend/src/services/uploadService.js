import config from "../config/index.js";

function getUploadOptions(file, folder) {
  if (file.mimetype.startsWith("video/")) {
    return {
      method: "upload_chunked_stream",
      options: {
        folder,
        resource_type: "video",
        chunk_size: Number(process.env.CLOUDINARY_UPLOAD_CHUNK_SIZE || 20 * 1024 * 1024),
      },
    };
  }

  if (file.mimetype.startsWith("image/")) {
    return {
      method: "upload_stream",
      options: {
        folder,
        resource_type: "image",
        transformation: [
          { width: 1200, height: 800, crop: "limit" },
          { quality: "auto:good" },
        ],
      },
    };
  }

  return {
    method: "upload_stream",
    options: {
      folder,
      resource_type: file.mimetype === "application/pdf" ? "raw" : "auto",
    },
  };
}

export async function uploadToCloudinary(file, folder = "edunest") {
  if (
    !config.cloudinary.cloudName ||
    !config.cloudinary.apiKey ||
    !config.cloudinary.apiSecret
  ) {
    throw new Error("Cloudinary chưa được cấu hình");
  }

  const { v2: cloudinary } = await import("cloudinary").then((m) => ({
    v2: m.v2,
  }));

  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });

  const uploadConfig = getUploadOptions(file, folder);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader[uploadConfig.method](
      uploadConfig.options,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
          });
        }
      },
    );

    uploadStream.end(file.buffer);
  });
}

export async function deleteFromCloudinary(publicId) {
  if (
    !config.cloudinary.cloudName ||
    !config.cloudinary.apiKey ||
    !config.cloudinary.apiSecret
  ) {
    return;
  }

  const { v2: cloudinary } = await import("cloudinary").then((m) => ({
    v2: m.v2,
  }));

  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });

  return cloudinary.uploader.destroy(publicId);
}

export function getPublicIdFromUrl(url) {
  if (!url || !url.includes("cloudinary.com")) return null;
  const parts = url.split("/");
  const uploadIndex = parts.findIndex((p) => p === "upload");
  if (uploadIndex === -1) return null;
  const publicIdWithExtension = parts.slice(uploadIndex + 1).join("/");
  return publicIdWithExtension.replace(/\.[^.]+$/, "");
}
