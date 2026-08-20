export const isValidFilterParam = (val?: string): val is string =>
  !!val && val.trim() !== '' && val.toUpperCase() !== 'ALL';
