import '@testing-library/jest-dom';

if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

jest.mock('react-markdown', () => {
  return function DummyMarkdown({ children }: { children: React.ReactNode }) {
    return children;
  };
});

