const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log(`Platform: ${os.platform()}`);
console.log(`CPU: ${os.cpus()[0].model}`);
console.log(`Total Memory: ${os.totalmem()}`);

// Path module
const targetPath = path.join('/path/to', 'sample-files', 'folder', 'file.txt');
console.log(`Joined path: ${targetPath}`);

// fs.promises API
const fsPromises = require('fs/promises');

async function handleFileOps(){
  const filePath = path.join(sampleFilesDir, 'demo.txt');
  try{
    await fsPromises.writeFile(filePath, 'Hello from fs.promises!');

    const content = await fsPromises.readFile(filePath, 'utf8');
    console.log(`fs.promises read: ${content}`);
  }catch (err) {
    console.error('File operation failed:', err.message);
  }
}
handleFileOps();

// Streams for large files- log first 40 chars of each chunk
const largeFilePath = path.join(sampleFilesDir, 'largefile.txt');
fs.writeFileSync(largeFilePath, 'This is a line in a large file that is used...'.repeat(100));

const readStream = fs.createReadStream(largeFilePath, {
  encoding: 'utf8',
  highWaterMark: 1024
});

readStream.on('data', (chunk) => {
  const first40 = chunk.substring(0,40);
  console.log(`Read chunk: ${first40}`);
});

readStream.on('end', ()=> {
  console.log('Finished reading large file with streams.');
});

readStream.on('error', (err) => {
  console.error('Stream error:', err.message);
});