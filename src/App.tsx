import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Upload } from 'lucide-react';

function App() {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const words = text.split(' ').filter(word => word.length > 0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript.trim().toLowerCase();
        setTranscript(transcript);
        
        const spokenWords = transcript.split(' ');
        const lastSpokenWord = spokenWords[spokenWords.length - 1];
        
        // Find the next matching word, allowing for partial matches
        const nextWordIndex = words.findIndex((word, index) => {
          if (index <= currentWordIndex) return false;
          const cleanWord = word.toLowerCase().replace(/[.,!?;]/, '');
          return cleanWord.includes(lastSpokenWord) || lastSpokenWord.includes(cleanWord);
        });

        if (nextWordIndex !== -1) {
          setCurrentWordIndex(nextWordIndex);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current?.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentWordIndex, words, isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setTranscript('');
    } else {
      setCurrentWordIndex(-1);
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setCurrentWordIndex(-1);
    setTranscript('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setText(e.target?.result as string);
        setCurrentWordIndex(-1);
        setTranscript('');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Reading Progress Tracker</h1>
          
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg cursor-pointer hover:bg-purple-200 transition-colors">
                <Upload size={20} />
                <span>Upload Text File</span>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={toggleListening}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </button>
            </div>

            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Enter or paste your text here..."
              className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Reading Area</h2>
            <div className="prose max-w-none">
              {words.map((word, index) => (
                <span
                  key={index}
                  className={`inline-block mr-1 px-1 rounded transition-colors ${
                    index === currentWordIndex
                      ? 'bg-purple-200 text-purple-800'
                      : index < currentWordIndex
                      ? 'text-gray-400'
                      : 'text-gray-800'
                  }`}
                >
                  {word}
                </span>
              ))}
            </div>
            {isListening && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600">
                  Detected speech: {transcript}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;