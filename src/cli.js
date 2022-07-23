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

async function load (options) {
  const data = await loadImpl(options);
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
    .option('-y, --year <year>', 'Limit by year')
    .description('load article metadata and send them to standard output or a file')
    .action(load)
  );

  await program.parseAsync();
}

main();
