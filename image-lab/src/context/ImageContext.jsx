import { createContext, useContext, useState, useCallback } from 'react';
import { historyService } from '../services/api';

const ImageContext = createContext(null);

export const ImageProvider = ({ children }) => {
  const [originalImage, setOriginalImage] = useState(null);   // base64 or URL
  const [processedImage, setProcessedImage] = useState(null); // base64 or URL
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [metadata, setMetadata] = useState(null); // { width, height, size, name }
  const [activeFeature, setActiveFeature] = useState('noise'); // noise | convolution | blur | edge
  const [historyId, setHistoryId] = useState(null);

  const loadImage = useCallback((src, meta) => {
    setOriginalImage(src);
    setProcessedImage(src);
    setMetadata(meta);
    setHistory([src]);
    setHistoryIndex(0);
    // Sync historyId if meta contains an id
    if (meta?.id) setHistoryId(meta.id);
  }, []);

  const pushResult = useCallback((resultSrc) => {
    setProcessedImage(resultSrc);
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, resultSrc];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setProcessedImage(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  const reset = useCallback(() => {
    setProcessedImage(originalImage);
    setHistory([originalImage]);
    setHistoryIndex(0);
  }, [originalImage]);

  const canUndo = historyIndex > 0;

  return (
    <ImageContext.Provider value={{
      originalImage, processedImage, metadata, history, historyIndex,
      activeFeature, setActiveFeature,
      historyId, setHistoryId,
      loadImage, pushResult, undo, reset, canUndo,
      setProcessedImage,
    }}>
      {children}
    </ImageContext.Provider>
  );
};

export const useImage = () => useContext(ImageContext);