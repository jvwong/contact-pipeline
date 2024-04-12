export function myParseInt (value) {
  // parseInt takes a string and a radix
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new TypeError('Not a number.');
  }
  return parsedValue;
}

export function toDate (str) {
  const d = new Date(str);
  if (isNaN(d)) {
    throw new Error('Invalid Date');
  } else {
    return d;
  }
}
