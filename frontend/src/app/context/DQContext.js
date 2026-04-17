'use client';
import { createContext, useContext, useState } from 'react';

const DQContext = createContext();

export function DQProvider({ children }) {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState(null);
  const [cleanResult, setCleanResult] = useState(null);
  const [isCleanLoading, setIsCleanLoading] = useState(false);
  const [cleanError, setCleanError] = useState(null);

  const uploadFile = async (file) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setCleanResult(null);
    let cumulativeResult = {};

    try {
      // Step 1: Upload and Extract Metadata
      setStatusText("Extracting Schema & Masking PII...");
      const formData = new FormData();
      formData.append('file', file);
      
      const resUpload = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!resUpload.ok) {
        const errText = await resUpload.text();
        throw new Error(`Upload failed: ${errText}`);
      }
      const step1Data = await resUpload.json();
      cumulativeResult = { ...cumulativeResult, ...step1Data };
      setAnalysisResult({ ...cumulativeResult });

      // Step 2: Run DQ dimension tests
      setStatusText("Running 6 Dimensions DQ Engine...");
      const resDq = await fetch('http://localhost:8000/api/run-dq');
      if (!resDq.ok) {
        const errText = await resDq.text();
        throw new Error(`DQ Engine failed: ${errText}`);
      }
      const step2Data = await resDq.json();
      cumulativeResult = { ...cumulativeResult, ...step2Data };
      setAnalysisResult({ ...cumulativeResult });

      // Step 3: Invoke Gemma LLM
      setStatusText("Invoking Gemma 4 LLM (generating rules)...");
      const resLlm = await fetch('http://localhost:8000/api/generate-rules');
      if (!resLlm.ok) {
        const errText = await resLlm.text();
        throw new Error(`Gemma LLM failed: ${errText}`);
      }
      const step3Data = await resLlm.json();
      cumulativeResult = { ...cumulativeResult, ...step3Data };
      setAnalysisResult({ ...cumulativeResult });

      setStatusText("Done!");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusText(""), 2000);
    }
  };

  const runCleanTransform = async () => {
    setIsCleanLoading(true);
    setCleanError(null);
    setCleanResult(null);
    try {
      const res = await fetch('http://localhost:8000/api/clean-transform', { method: 'POST' });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Cleaning pipeline failed: ${errText}`);
      }
      const data = await res.json();
      setCleanResult(data);
    } catch (err) {
      console.error(err);
      setCleanError(err.message);
    } finally {
      setIsCleanLoading(false);
    }
  };

  const resetState = () => {
    setAnalysisResult(null);
    setCleanResult(null);
    setError(null);
    setCleanError(null);
    setIsLoading(false);
    setIsCleanLoading(false);
    setStatusText("");
  };

  return (
    <DQContext.Provider value={{ analysisResult, isLoading, statusText, error, uploadFile, cleanResult, isCleanLoading, cleanError, runCleanTransform, resetState }}>
      {children}
    </DQContext.Provider>
  );
}

export function useDQContext() {
  return useContext(DQContext);
}
