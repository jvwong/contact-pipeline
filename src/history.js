import _ from 'lodash';
import { eSummaryPubmed } from './util/pubmed.js';

const formatDate = d => {
  if (d) {
    return new Date(d).toISOString().split('T')[0];
  } else {
    return '';
  }
};

const formatSummary = summary => {
  const { uid, history, source } = summary;
  const output = _.assign({}, { uid, source });
  const statuses = ['accepted', 'pubmed'];
  statuses.forEach(status => {
    const item = _.find(history, ['pubstatus', status]);
    if (item) {
      const { pubstatus, date } = item;
      output[pubstatus] = formatDate(date);
    }
  });

  return output;
};

/**
 * history
 *
 * Load the article history metadata and map to a csv
 * @param {Array} id the comma-separated list of PubMed IDs
 * @param {object} options
 * @return {object} the corresponding results
 */
export default async function history (id, options) {
  const data = await eSummaryPubmed(id);
  const formatted = data.map(formatSummary);
  return formatted;
}
