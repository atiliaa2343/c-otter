const readXlsxFile = require('read-excel-file/node')
const path = require('node:path');

// const PATH = path.resolve("Health_Care_Organizations_in_Petersburg_VA_Phrases.xlsx");

// two file paths
const LOCATION_PATH = path.resolve("locations.xlsx");
const HOUR_OF_OPS_PATH = path.resolve("hours_of_operation.xlsx");


// File path.
readXlsxFile(LOCATION_PATH).then((rows) => {
  // `rows` is an array of rows
  // each row being an array of cells.
  for(let row of rows){
    console.log(row);
  }
});

readXlsxFile(HOUR_OF_OPS_PATH).then((rows) => {
  // `rows` is an array of rows
  // each row being an array of cells.
  for(let row of rows){
    console.log(row);
  }
});