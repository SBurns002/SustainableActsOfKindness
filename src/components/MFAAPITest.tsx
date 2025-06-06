import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Play, CheckCircle, XCircle, AlertCircle, Clock, Wifi, WifiOff } from 'lucide-react';

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error' | 'running';
  message: string;
  data?: any;
  error?: any;
  duration?: number;
}

export default function MFAAPITest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  const addResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const updateResult = (step: string, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map(result => 
      result.step === step ? { ...result, ...updates } : result
    ));
  };

  const testStep = async (stepName: string, testFunction: () => Promise<any>) => {
    const startTime = Date.now();
    setCurrentStep(stepName);
    
    addResult({
      step: stepName,
      status: 'running',
      message: 'Testing...'
    });

    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      updateResult(stepName, {
        status: 'success',
        message: 'Success',
        data: result,
        duration
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      updateResult(stepName, {
        status: 'error',
        message: error.message || 'Unknown error',
        error: error,
        duration
      });
      
      throw error;
    }
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentStep(null);

    try {
      // Test 1: Basic Authentication Check
      const user = await testStep('Authentication Check', async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user) throw new Error('User not authenticated');
        return user;
      });

      // Test 2: Network Connectivity
      await testStep('Network Connectivity', async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://kxcuiyvxxvylackjjlgn.supabase.co'}/rest/v1/`, {
            method: 'HEAD',
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y3VpeXZ4eHZ5bGFja2pqbGduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTM2NDMsImV4cCI6MjA2NDU2OTY0M30.gwzVhnfihnEu3mGdVQPz-NjKv1UsHSqwFQQEeyA6ALM'
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return { status: response.status, statusText: response.statusText };
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            throw new Error('Network request timed out after 5 seconds');
          }
          throw error;
        }
      });

      // Test 3: List Existing MFA Factors
      const existingFactors = await testStep('List MFA Factors', async () => {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        return data;
      });

      // Test 4: Clean up existing unverified factors
      if (existingFactors?.totp && existingFactors.totp.length > 0) {
        const unverifiedFactors = existingFactors.totp.filter(f => f.status !== 'verified');
        
        if (unverifiedFactors.length > 0) {
          await testStep('Cleanup Unverified Factors', async () => {
            const results = [];
            for (const factor of unverifiedFactors) {
              try {
                const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
                results.push({ factorId: factor.id, success: !error, error });
              } catch (err) {
                results.push({ factorId: factor.id, success: false, error: err });
              }
            }
            return results;
          });
        }
      }

      // Test 5: MFA Enrollment
      const enrollmentData = await testStep('MFA Enrollment', async () => {
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: `API Test ${new Date().toISOString()}`
        });
        
        if (error) throw error;
        if (!data) throw new Error('No enrollment data returned');
        if (!data.totp) throw new Error('No TOTP data in enrollment response');
        if (!data.totp.qr_code) throw new Error('No QR code in enrollment response');
        if (!data.totp.secret) throw new Error('No secret in enrollment response');
        
        return data;
      });

      // Test 6: MFA Challenge Creation
      const challengeData = await testStep('MFA Challenge Creation', async () => {
        if (!enrollmentData?.id) throw new Error('No factor ID from enrollment');
        
        const { data, error } = await supabase.auth.mfa.challenge({
          factorId: enrollmentData.id
        });
        
        if (error) throw error;
        if (!data) throw new Error('No challenge data returned');
        if (!data.id) throw new Error('No challenge ID returned');
        
        return data;
      });

      // Test 7: Test MFA Verification with Invalid Code (to test the endpoint)
      await testStep('MFA Verification Test (Invalid Code)', async () => {
        if (!enrollmentData?.id || !challengeData?.id) {
          throw new Error('Missing factor ID or challenge ID');
        }
        
        const { data, error } = await supabase.auth.mfa.verify({
          factorId: enrollmentData.id,
          challengeId: challengeData.id,
          code: '000000' // Invalid code
        });
        
        // We expect this to fail with invalid_code error
        if (error && error.message?.includes('invalid_code')) {
          return { expectedError: true, error: error.message };
        } else if (data) {
          throw new Error('Verification unexpectedly succeeded with invalid code');
        } else {
          throw new Error(`Unexpected error: ${error?.message || 'Unknown error'}`);
        }
      });

      // Test 8: Cleanup Test Factor
      await testStep('Cleanup Test Factor', async () => {
        if (!enrollmentData?.id) throw new Error('No factor ID to cleanup');
        
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: enrollmentData.id
        });
        
        if (error) throw error;
        return { cleaned: true };
      });

      // Test 9: Final MFA Status Check
      await testStep('Final MFA Status Check', async () => {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        return data;
      });

    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentStep(null);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">MFA API Testing Suite</h1>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            This comprehensive test will check all MFA API endpoints to identify where the issue is occurring.
          </p>
          
          <button
            onClick={runComprehensiveTest}
            disabled={isRunning}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-5 h-5" />
            {isRunning ? 'Running Tests...' : 'Run MFA API Tests'}
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Test Results</h2>
            
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 transition-colors ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{result.step}</h3>
                        <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                        
                        {result.duration && (
                          <p className="text-xs text-gray-500 mt-1">
                            Duration: {result.duration}ms
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Success Data */}
                  {result.status === 'success' && result.data && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Response Data:</h4>
                      <pre className="text-xs text-gray-600 overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Error Details */}
                  {result.status === 'error' && result.error && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <h4 className="text-sm font-medium text-red-700 mb-2">Error Details:</h4>
                      <pre className="text-xs text-red-600 overflow-x-auto">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Step Indicator */}
        {isRunning && currentStep && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-800 font-medium">Currently testing: {currentStep}</span>
            </div>
          </div>
        )}

        {/* Network Status */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Environment Info</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL || 'Using fallback URL'}</div>
            <div>API Key Length: {(import.meta.env.VITE_SUPABASE_ANON_KEY || '').length || 'Using fallback key'}</div>
            <div>Online Status: {navigator.onLine ? 'Online' : 'Offline'}</div>
            <div>User Agent: {navigator.userAgent}</div>
          </div>
        </div>
      </div>
    </div>
  );
}