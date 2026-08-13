const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Supported mime types for images
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

class LocalStorageProvider {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../public/uploads');
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file) {
    // Basic validations
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File is too large. Maximum allowed size is 5MB.');
    }

    // Generate unique name
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueName = crypto.randomBytes(16).toString('hex') + ext;
    const destPath = path.join(this.uploadDir, uniqueName);

    // Write file to upload directory
    await fs.promises.writeFile(destPath, file.buffer);

    // Return the URL for accessing it (configurable via env)
    const baseUrl = process.env.IMAGE_STORAGE_URL || 'http://localhost:5000/uploads';
    return `${baseUrl}/${uniqueName}`;
  }

  async deleteFile(fileUrl) {
    try {
      const parts = fileUrl.split('/');
      const fileName = parts[parts.length - 1];
      const filePath = path.join(this.uploadDir, fileName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return true;
    } catch (error) {
      console.error('Failed to delete local file:', error);
      return false;
    }
  }
}

class StorageService {
  constructor() {
    const provider = process.env.IMAGE_STORAGE_PROVIDER || 'local';
    if (provider === 'local') {
      this.provider = new LocalStorageProvider();
    } else {
      // Future cloud integrations (S3, Cloudinary) go here
      this.provider = new LocalStorageProvider();
    }
  }

  async uploadImage(file) {
    return this.provider.saveFile(file);
  }

  async deleteImage(fileUrl) {
    return this.provider.deleteFile(fileUrl);
  }
}

module.exports = new StorageService();
