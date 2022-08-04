#! /usr/bin/env node

// import fs from 'fs';
import { writeFile } from 'fs/promises';
import { program } from 'commander';
import { load as loadImpl } from './load.js';
import { json2csv } from './util/format.js';
// import getStdin from 'get-stdin';

const formatJSON = obj => JSON.stringify(obj, null, 2);
const printFormattedJSON = obj => console.log(formatJSON(obj));
const writeFormattedJSON = async (obj, file) => await writeFile(file, formatJSON(obj));
const writeCsv = async (data, file) => await writeFile(file, data);

const MAX_DATE_RETHINKDB = '9999-12-31';

function toDate (str) {
  const d = new Date(str);
  if (isNaN(d)) {
    throw new Error('Invalid Date');
  } else {
    return d;
  }
}

async function load (start, end, options) {
  const endDate = end ? toDate(end) : toDate(MAX_DATE_RETHINKDB);
  const startDate = toDate(start);
  const data = await loadImpl(startDate, endDate, options);
  await sendOutput(data, options);
}

async function sendOutput (data, options) {
  if (options.output) {
    await writeCsv(json2csv(data), options.output);
  } else {
    printFormattedJSON(data);
  }
}

async function main () {
  (program
    .name('contact-pipeline')
    .description('A CLI to map article metadata to a contact list')
  );

  (program.command('load')
    .option('-o, --output <file>', 'Output file (standard output by default)')
    .argument('<start>', 'start date (yyyy-mm-dd)')
    .argument('[end]', 'end date (yyyy-mm-dd)')
    .description('load article metadata and send them to standard output or a file')
    .action(load)
  );

  await program.parseAsync();
}

main();
