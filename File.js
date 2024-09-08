const fs = require('fs');

// Function to read data from a JSON file
function readFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf-8'); // Synchronous read
        return JSON.parse(data); // Convert JSON string to JavaScript object
    } catch (err) {
        console.error(`Error reading file from disk: ${err}`);
        return []; // Return empty array in case of an error
    }
}

// Function to write data to a JSON file
function writeFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8'); // Convert JavaScript object to JSON string and write to file
    } catch (err) {
        console.error(`Error writing file to disk: ${err}`);
    }
}

module.exports = {
    readFile,
    writeFile
};
