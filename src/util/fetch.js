const failOnBadStatus = res => {
  if (!res.ok) {
    throw new Error(`Fetch failed due to bad status code : ${res.statusText} : ${res.url}`);
  } else {
    return res;
  }
};

async function safeFetch (url, options) {
  return fetch(url, options).then(failOnBadStatus);
}

export default safeFetch;
