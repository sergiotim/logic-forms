import '@testing-library/jest-dom';

if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

