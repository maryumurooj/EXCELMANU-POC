// hooks/useUndoRedo.ts
import { useState, useRef, useCallback } from 'react';

interface UseUndoRedoReturn<T> {
  state: T;
  setState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
  historyCount: { past: number; future: number }; // ✅ Add this
}

export function useUndoRedo<T>(initialState: T, maxHistorySize = 50): UseUndoRedoReturn<T> {
  const [state, setState] = useState<T>(initialState);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const [historyCount, setHistoryCount] = useState({ past: 0, future: 0 }); // ✅ Track counts


  const updateHistoryCount = useCallback(() => {
    setHistoryCount({ past: past.current.length, future: future.current.length });
  }, []);

  const setNewState = useCallback((newState: T) => {
    past.current.push(state);
    
    if (past.current.length > maxHistorySize) {
      past.current.shift();
    }
    
    future.current = [];
    setState(newState);
    updateHistoryCount(); // ✅ Update counts
  }, [state, maxHistorySize, updateHistoryCount]);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    
    const previous = past.current.pop()!;
    future.current.push(state);
    setState(previous);
    updateHistoryCount(); // ✅ Update counts
  }, [state, updateHistoryCount]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    
    const next = future.current.pop()!;
    past.current.push(state);
    setState(next);
    updateHistoryCount(); // ✅ Update counts
  }, [state, updateHistoryCount]);

  const clearHistory = useCallback(() => {
    past.current = [];
    future.current = [];
    updateHistoryCount(); // ✅ Update counts
  }, [updateHistoryCount]);

  return {
    state,
    setState: setNewState,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    clearHistory,
    historyCount // ✅ Return counts
  };
}
