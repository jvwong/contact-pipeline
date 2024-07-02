import fetch from '../util/fetch.js';
import _ from 'lodash';

import {
  NCBI_EUTILS_BASE_URL,
  NCBI_EUTILS_API_KEY
} from '../config.js';

const EUTILS_SUMMARY_URL = NCBI_EUTILS_BASE_URL + 'entrez/eutils/esummary.fcgi';
const DEFAULT_ESEARCH_PARAMS = {
  db: 'pubmed',
  retmode: 'json',
  api_key: NCBI_EUTILS_API_KEY
};

const eSummaryConverter = json => {
  const result = _.get(json, ['result']);
  const results = _.omit(result, ['uids']);
  const values = _.values(results);
  return values;
};

const checkEsummary = json => {
  const errorMessage = _.get(json, ['error']);
  if (errorMessage) throw new Error(errorMessage);
  return json;
};

const eSummaryPubmed = async (id, opts) => {
  const params = _.assign({}, DEFAULT_ESEARCH_PARAMS, opts, { id });
  const paramPairs = _.toPairs(params);
  const body = new URLSearchParams(paramPairs);
  const url = EUTILS_SUMMARY_URL;
  const response = await fetch(url, {
    method: 'POST',
    body
  });
  let jsonResponse = await response.json();
  jsonResponse = checkEsummary(jsonResponse);
  const data = eSummaryConverter(jsonResponse);
  return data;
};

export {
  eSummaryPubmed
};
