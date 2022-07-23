import { Parser } from 'json2csv';

export function json2csv (jsonData) {
  try {
    const parser = new Parser();
    const csv = parser.parse(jsonData);
    return csv;
  } catch (err) {
    console.error(err);
  }
};
