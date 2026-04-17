'use client';

import { DQProvider } from './DQContext';

export default function Providers({ children }) {
  return (
    <DQProvider>
      {children}
    </DQProvider>
  );
}
