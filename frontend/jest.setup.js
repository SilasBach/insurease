// Mock import.meta
if (typeof global.import === 'undefined') {
  global.import = {
    meta: {
      env: {
        VITE_API_BASE_URL: 'http://localhost:3000',
      },
    },
  };
}

// Mock fetch
global.fetch = jest.fn();
