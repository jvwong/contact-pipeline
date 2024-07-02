import _ from 'lodash';
import { Parser } from 'json2csv';
import { writeFile } from 'fs/promises';

const formatJSON = obj => JSON.stringify(obj, null, 2);
const writeCsv = async (data, file) => await writeFile(file, data);
const printFormattedJSON = obj => console.log(formatJSON(obj));

export function json2csv (jsonData) {
  try {
    const parser = new Parser();
    const csv = parser.parse(jsonData);
    return csv;
  } catch (err) {
    console.error(err);
  }
};

export const formatInfo = info => {
  const cleaned = _.omit(info, ['authorName']);
  const { authorName } = info;
  if (authorName) cleaned.authorName = authorName.replace(/ .*/, '');
  return cleaned;
};

export async function sendOutput (data, options) {
  if (options.output) {
    await writeCsv(json2csv(data), options.output);
  } else {
    printFormattedJSON(data);
  }
}
