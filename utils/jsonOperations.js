const fs = require('fs').promises;
const path = require('path');

// Helper function to read JSON file
const readJsonFile = async (filename) => {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    const fileData = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    throw error;
  }
};

// Helper function to write JSON file
const writeJsonFile = async (filename, data) => {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 4));
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    throw error;
  }
};

module.exports = {
  readJsonFile,
  writeJsonFile
}; 