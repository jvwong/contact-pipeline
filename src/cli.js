#! /usr/bin/env node

import _ from 'lodash';
import { writeFile } from 'fs/promises';
import { program } from 'commander';
import { load as loadImpl } from './load.js';
import { json2csv } from './util/format.js';
import { MAX_DATE, MIN_DATE } from './util/db.js';
// import getStdin from 'get-stdin';

const formatJSON = obj => JSON.stringify(obj, null, 2);
const printFormattedJSON = obj => console.log(formatJSON(obj));
// const writeFormattedJSON = async (obj, file) => await writeFile(file, formatJSON(obj));
const writeCsv = async (data, file) => await writeFile(file, data);

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
  const lastUpdatedStart = toDate(options.lastUpdatedStart);
  const lastUpdatedEnd = toDate(options.lastUpdatedEnd);
  const startDate = toDate(options.start);
  const endDate = toDate(options.end);
  const data = await loadImpl(lastUpdatedStart, lastUpdatedEnd, startDate, endDate, options);
  await sendOutput(data, options);
}

const formatInfo = info => {
  const cleaned = _.omit(info, ['authorName']);
  const { authorName } = info;
  if (authorName) cleaned.authorName = authorName.replace(/ .*/, '');
  return cleaned;
};

async function sendOutput (data, options) {
  if (options.output) {
    const clean = data.map(formatInfo);
    await writeCsv(json2csv(clean), options.output);
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
    .option('-u, --last-updated-start <str>', 'Last updated start date (yyyy-mm-dd)', MIN_DATE)
    .option('-m, --last-updated-end <str>', 'Last updated end date (yyyy-mm-dd)', MAX_DATE)
    .option('-s, --start <str>', 'Publication Start date (yyyy-mm-dd)', MIN_DATE)
    .option('-e, --end <str>', 'Publication end date (yyyy-mm-dd)', MAX_DATE)
    .option('-l, --limit <number>', 'Max number of items', myParseInt, MAX_NUM_ITEMS)
    .option('-a, --all', 'Include all items without author-linked email')
    .option('-o, --output <str>', 'Output file (stdout by default)')
    .description('load article metadata and send them to standard output or a file')
    .action(load)
  );

  await program.parseAsync();
}

main();
