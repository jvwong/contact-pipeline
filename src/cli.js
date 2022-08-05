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
const MIN_DATE_RETHINKDB = '1400-01-01';
const MAX_NUM_ITEMS = 100000;

function myParseInt (value) {
  // parseInt takes a string and a radix
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new program.InvalidArgumentError('Not a number.');
  }
  return parsedValue;
}

function toDate (str) {
  const d = new Date(str);
  if (isNaN(d)) {
    throw new Error('Invalid Date');
  } else {
    return d;
  }
}

async function load (options) {
  const startDate = toDate(options.start);
  const endDate = toDate(options.end);
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
    .option('-o, --output <str>', 'Output file (stdout by default)')
    .option('-s, --start <date>', 'Start date (yyyy-mm-dd)', MIN_DATE_RETHINKDB)
    .option('-e, --end <date>', 'End date (yyyy-mm-dd)', MAX_DATE_RETHINKDB)
    .option('-l, --limit <number>', 'Max number of items', myParseInt, MAX_NUM_ITEMS)
    .description('load article metadata and send them to standard output or a file')
    .action(load)
  );

  await program.parseAsync();
}

main();
