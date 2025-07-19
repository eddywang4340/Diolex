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

// Piston API types
interface PistonExecuteResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
}

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  description: string;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: (code: string, language: string) => Promise<string>;
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
  pistonLanguage: string;
}

// Piston API utilities
const PISTON_API_BASE = 'https://emkc.org/api/v2/piston';

const executePistonCode = async (code: string, language: string, input: string = ''): Promise<PistonExecuteResponse> => {
  const response = await fetch(`${PISTON_API_BASE}/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      language: language,
      version: '*',
      files: [
        {
          name: `main.${getFileExtension(language)}`,
          content: code,
        },
      ],
      stdin: input,
      compile_timeout: 10000,
      run_timeout: 3000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Piston API error: ${response.status}`);
  }

  return response.json();
};

const getFileExtension = (language: string): string => {
  const extensions: Record<string, string> = {
    python: 'py',
    javascript: 'js',
    typescript: 'ts',
    java: 'java',
    cpp: 'cpp',
    go: 'go',
  };
  return extensions[language] || 'txt';
};

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
    codemirrorLang: python(),
    pistonLanguage: 'python'
  },
  javascript: {
    label: 'JavaScript',
    defaultCode: `function solution() {
    // Write your solution here
    
}

// Test your solution
console.log(solution());`,
    extension: 'js',
    codemirrorLang: javascript(),
    pistonLanguage: 'javascript'
  },
  typescript: {
    label: 'TypeScript',
    defaultCode: `function solution(): any {
    // Write your solution here
    
}

// Test your solution
console.log(solution());`,
    extension: 'ts',
    codemirrorLang: javascript({ typescript: true }),
    pistonLanguage: 'typescript'
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
    codemirrorLang: java(),
    pistonLanguage: 'java'
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
    codemirrorLang: cpp(),
    pistonLanguage: 'cpp'
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
    codemirrorLang: javascript(), // Use JS highlighting for Go as fallback
    pistonLanguage: 'go'
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
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isTestCaseMode, setIsTestCaseMode] = useState(false);
  const [newTestCase, setNewTestCase] = useState<Omit<TestCase, 'id'>>({
    input: '',
    expectedOutput: '',
    description: ''
  });

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

  const executeCode = async (codeToRun: string, input: string = ''): Promise<string> => {
    try {
      const result = await executePistonCode(
        codeToRun, 
        languageConfigs[selectedLanguage].pistonLanguage, 
        input
      );
      
      if (result.run.stderr) {
        return `Error:\n${result.run.stderr}\n\nOutput:\n${result.run.stdout}`;
      }
      
      return result.run.stdout || 'No output';
    } catch (error) {
      return `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  const handleRunCode = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setIsOutputVisible(true);
    setOutput('Running code...');
    
    try {
      let result = '';
      
      if (testCases.length > 0) {
        // Run against test cases
        result = 'Running test cases:\n\n';
        
        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i];
          result += `Test Case ${i + 1}: ${testCase.description}\n`;
          result += `Input: ${testCase.input || '(no input)'}\n`;
          result += `Expected: ${testCase.expectedOutput}\n`;
          
          const output = await executeCode(value, testCase.input);
          const actualOutput = output.trim();
          const expected = testCase.expectedOutput.trim();
          
          result += `Actual: ${actualOutput}\n`;
          result += `Status: ${actualOutput === expected ? '✅ PASS' : '❌ FAIL'}\n\n`;
        }
      } else {
        // Run code normally
        result = await executeCode(value);
      }
      
      setOutput(result);
      
      // Call the onRun callback if provided
      if (onRun) {
        await onRun(value, selectedLanguage);
      }
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  }, [value, selectedLanguage, isRunning, testCases, onRun]);

  const handleSubmitCode = useCallback(() => {
    if (!onSubmit) return;
    onSubmit(value, selectedLanguage);
  }, [onSubmit, value, selectedLanguage]);

  const addTestCase = useCallback(() => {
    if (!newTestCase.description.trim()) return;
    
    const testCase: TestCase = {
      id: Date.now().toString(),
      ...newTestCase
    };
    
    setTestCases(prev => [...prev, testCase]);
    setNewTestCase({ input: '', expectedOutput: '', description: '' });
  }, [newTestCase]);

  const removeTestCase = useCallback((id: string) => {
    setTestCases(prev => prev.filter(tc => tc.id !== id));
  }, []);

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
              {/* Test Cases Toggle */}
              <Button
                variant={isTestCaseMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsTestCaseMode(!isTestCaseMode)}
                className="h-8 text-xs"
              >
                {isTestCaseMode ? 'Hide Tests' : 'Test Cases'}
              </Button>
              
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
          {/* Test Cases Section */}
          {isTestCaseMode && (
            <div className="p-4 border-b border-slate-700 bg-slate-900/30">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Test Cases</h4>
                
                {/* Existing Test Cases */}
                {testCases.map((testCase, index) => (
                  <div key={testCase.id} className="bg-slate-800/50 p-3 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-white mb-1">
                          Test {index + 1}: {testCase.description}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">Input:</span>
                            <pre className="text-slate-300 mt-1 bg-slate-900/50 p-2 rounded">
                              {testCase.input || '(no input)'}
                            </pre>
                          </div>
                          <div>
                            <span className="text-slate-400">Expected:</span>
                            <pre className="text-slate-300 mt-1 bg-slate-900/50 p-2 rounded">
                              {testCase.expectedOutput}
                            </pre>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTestCase(testCase.id)}
                        className="ml-2 h-6 w-6 p-0 border-slate-600 text-slate-400 hover:bg-red-600 hover:text-white"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Add New Test Case */}
                <div className="bg-slate-800/30 p-3 rounded-lg border border-dashed border-slate-600">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Test description..."
                      value={newTestCase.description}
                      onChange={(e) => setNewTestCase(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-slate-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <textarea
                        placeholder="Input (optional)"
                        value={newTestCase.input}
                        onChange={(e) => setNewTestCase(prev => ({ ...prev, input: e.target.value }))}
                        className="bg-slate-900/50 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-slate-500 resize-none"
                        rows={2}
                      />
                      <textarea
                        placeholder="Expected output"
                        value={newTestCase.expectedOutput}
                        onChange={(e) => setNewTestCase(prev => ({ ...prev, expectedOutput: e.target.value }))}
                        className="bg-slate-900/50 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-slate-500 resize-none"
                        rows={2}
                      />
                    </div>
                    <Button
                      onClick={addTestCase}
                      disabled={!newTestCase.description.trim()}
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-7"
                    >
                      Add Test Case
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                    {testCases.length > 0 ? 'Run Tests' : 'Run'}
                  </div>
                )}
              </Button>

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