const fs = require('fs');
const path = require('path');


// Write a sample file for demonstration
const folderPath = path.join(__dirname, 'sample-files');
const filePath = path.join(folderPath,'sample.txt');
const fileContent = 'Hello, async world!';

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
}
fs.writeFileSync(filePath, fileContent);

// 1. Callback style
fs.readFile(filePath, 'utf8', (err, data) =>{
  if (err) {
    console.error('Callback error:', err.message);
    return;
  }
  console.log('Callback read:', data);
  runPromiseDemo();
});

  // Callback hell example (test and leave it in comments):
/* Callback hell happens when you have multiple asynchronous operations deeply nested with one another due to each step relying on the result of the previous operation creating 
what appears like a pyramid. This makes code hard to read and debug. Example:

fs.readFile(file1, 'utf8', (err, data1) => {
  fs.readFile(file2, 'utf8', (err,data2)=> {
    fs.writeFile(file3, data1 + data2, (err) =>{
      if (err) console.error(err);
      console.log('Done!');
      });
    });
  });

*/

  // 2. Promise style
  const fsPromises = require('fs/promises');

  function runPromiseDemo() {
    fsPromises.readFile(filePath, 'utf8')
    .then((data) => {
      console.log('Promise read:', data);
      return runAsyncAwaitDemo();
    })
    .catch((err) => {
      console.error('Promise error:', err.message);
    });
  }

      // 3. Async/Await style
      async function runAsyncAwaitDemo() {
        try {
          const data = await fsPromises.readFile(filePath, 'utf8');
          console.log('Async/Await read:', data);

        }catch (err) {
          console.error('Async/Await error:', err.message);
        }
      }
