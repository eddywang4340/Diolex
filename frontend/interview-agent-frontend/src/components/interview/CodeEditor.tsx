// components/interview/CodeEditor.tsx
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: (code: string, language: string) => void;
  onSubmit?: (code: string, language: string) => void;
  className?: string;
  disabled?: boolean;
}

type ProgrammingLanguage = 'python' | 'javascript' | 'typescript' | 'java' | 'cpp' | 'go';

interface LanguageConfig {
  label: string;
  defaultCode: string;
  extension: string;
  codemirrorLang: any;
}

const languageConfigs: Record<ProgrammingLanguage, LanguageConfig> = {
  python: {
    label: 'Python',
    defaultCode: `def solution():
    # Write your solution here
    pass

# Test your solution
if __name__ == "__main__":
    result = solution()
    print(result)`,
    extension: 'py',
    codemirrorLang: python()
  },
  javascript: {
    label: 'JavaScript',
    defaultCode: `function solution() {
    // Write your solution here
    
}

// Test your solution
console.log(solution());`,
    extension: 'js',
    codemirrorLang: javascript()
  },
  typescript: {
    label: 'TypeScript',
    defaultCode: `function solution(): any {
    // Write your solution here
    
}

// Test your solution
console.log(solution());`,
    extension: 'ts',
    codemirrorLang: javascript({ typescript: true })
  },
  java: {
    label: 'Java',
    defaultCode: `public class Solution {
    public static void main(String[] args) {
        Solution sol = new Solution();
        // Test your solution
        System.out.println(sol.solution());
    }
    
    public Object solution() {
        // Write your solution here
        return null;
    }
}`,
    extension: 'java',
    codemirrorLang: java()
  },
  cpp: {
    label: 'C++',
    defaultCode: `#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    // Write your solution here
    
};

int main() {
    Solution sol;
    // Test your solution
    return 0;
}`,
    extension: 'cpp',
    codemirrorLang: cpp()
  },
  go: {
    label: 'Go',
    defaultCode: `package main

import "fmt"

func solution() interface{} {
    // Write your solution here
    return nil
}

func main() {
    result := solution()
    fmt.Println(result)
}`,
    extension: 'go',
    codemirrorLang: javascript() // Use JS highlighting for Go as fallback
  }
};

const CodeEditor = ({
  value,
  onChange,
  onRun,
  onSubmit,
  className = '',
  disabled = false,
}: CodeEditorProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>('python');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [isOutputVisible, setIsOutputVisible] = useState(false);

  const handleLanguageChange = useCallback((language: ProgrammingLanguage) => {
    setSelectedLanguage(language);
    // If the current code is empty or is the default for another language, 
    // switch to the new language's default
    const isDefaultCode = Object.values(languageConfigs).some(
      config => value.trim() === config.defaultCode.trim()
    );
    
    if (!value.trim() || isDefaultCode) {
      onChange(languageConfigs[language].defaultCode);
    }
  }, [value, onChange]);

  const handleRunCode = useCallback(async () => {
    if (!onRun || isRunning) return;
    
    setIsRunning(true);
    setOutput('Running...');
    setIsOutputVisible(true);
    
    try {
      await onRun(value, selectedLanguage);
      // Note: In a real implementation, onRun would be async and return the output
      // For now, we'll simulate it
      setTimeout(() => {
        setOutput('Code executed successfully!\n\n// Output would appear here in a real implementation');
        setIsRunning(false);
      }, 1500);
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsRunning(false);
    }
  }, [onRun, value, selectedLanguage, isRunning]);

  const handleSubmitCode = useCallback(() => {
    if (!onSubmit) return;
    onSubmit(value, selectedLanguage);
  }, [onSubmit, value, selectedLanguage]);

  const lineCount = value.split('\n').length;

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Code Editor
            </CardTitle>
            
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <Select
                value={selectedLanguage}
                onValueChange={handleLanguageChange}
                disabled={disabled}
              >
                <SelectTrigger className="w-32 h-8 bg-slate-900 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-600">
                  {Object.entries(languageConfigs).map(([key, config]) => (
                    <SelectItem
                      key={key}
                      value={key}
                      className="text-white hover:bg-slate-700"
                    >
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* CodeMirror Editor */}
          <div className="relative">
            <CodeMirror
              value={value}
              onChange={(val) => onChange(val)}
              theme={oneDark}
              extensions={[languageConfigs[selectedLanguage].codemirrorLang]}
              editable={!disabled}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: false,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                highlightSelectionMatches: false,
              }}
              className="text-sm"
              style={{
                fontSize: '14px',
                minHeight: '400px',
                backgroundColor: 'rgb(15 23 42 / 0.3)',
              }}
            />

            {/* Floating Action Buttons */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              {onRun && (
                <Button
                  onClick={handleRunCode}
                  disabled={disabled || isRunning || !value.trim()}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                >
                  {isRunning ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      Running
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Run
                    </div>
                  )}
                </Button>
              )}

              {onSubmit && (
                <Button
                  onClick={handleSubmitCode}
                  disabled={disabled || !value.trim()}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submit
                  </div>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Output Panel */}
      {isOutputVisible && (
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v3m0 4h1.428a1 1 0 001.356-1.247L7 14H3" />
                </svg>
                Output
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOutputVisible(false)}
                className="h-7 w-7 p-0 border-slate-600 text-slate-400 hover:bg-slate-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-950/50 p-4 rounded-lg text-sm text-slate-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
              {output || 'No output yet. Click "Run" to execute your code.'}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Editor Stats */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-slate-800 text-slate-300">
            {languageConfigs[selectedLanguage].label}
          </Badge>
          <span>{lineCount} lines</span>
          <span>{value.length} characters</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;