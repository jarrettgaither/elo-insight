import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "./ui/button"; 
import { Input } from "./ui/input"; 
import { Card, CardContent } from "./ui/card"; 
import { startSpan, withTracing } from "../lib/telemetry";

type FieldInteraction = {
  focusCount: number;
  editCount: number;
  totalTimeMs: number;
  lastFocusTime: number | null;
};

export function Register() {
  // Track when user first loads the registration form
  const pageLoadTime = useRef(Date.now());
  
  // Track field-level interactions
  const [fieldInteractions, setFieldInteractions] = useState<Record<string, FieldInteraction>>({
    username: { focusCount: 0, editCount: 0, totalTimeMs: 0, lastFocusTime: null },
    email: { focusCount: 0, editCount: 0, totalTimeMs: 0, lastFocusTime: null },
    password: { focusCount: 0, editCount: 0, totalTimeMs: 0, lastFocusTime: null }
  });

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  // Handle field focus to track time spent on each field
  const handleFieldFocus = (fieldName: string) => {
    setFieldInteractions(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        focusCount: prev[fieldName].focusCount + 1,
        lastFocusTime: Date.now()
      }
    }));
  };

  // Handle field blur to calculate time spent
  const handleFieldBlur = (fieldName: string) => {
    const field = fieldInteractions[fieldName];
    
    if (field.lastFocusTime !== null) {
      const timeSpent = Date.now() - field.lastFocusTime;
      
      setFieldInteractions(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          totalTimeMs: prev[fieldName].totalTimeMs + timeSpent,
          lastFocusTime: null
        }
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Track edit count for the field
    setFieldInteractions(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        editCount: prev[name].editCount + 1
      }
    }));
  };

  const getTotalInteractionTime = (): number => {
    return Object.values(fieldInteractions).reduce(
      (total, field) => total + field.totalTimeMs, 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    // Calculate total time on page and form interaction time
    const totalTimeOnPageMs = Date.now() - pageLoadTime.current;
    const totalInteractionTimeMs = getTotalInteractionTime();

    // Create a span for the registration process
    const registrationSpan = startSpan('user.registration');
    
    // Add user metrics as span attributes
    registrationSpan.setAttribute('user.email', form.email);
    registrationSpan.setAttribute('user.username', form.username);
    registrationSpan.setAttribute('user.registration.total_time_ms', totalTimeOnPageMs);
    registrationSpan.setAttribute('user.registration.interaction_time_ms', totalInteractionTimeMs);
    
    // Add field-level metrics
    Object.entries(fieldInteractions).forEach(([field, metrics]) => {
      registrationSpan.setAttribute(`user.form.${field}.time_ms`, metrics.totalTimeMs);
      registrationSpan.setAttribute(`user.form.${field}.focus_count`, metrics.focusCount);
      registrationSpan.setAttribute(`user.form.${field}.edit_count`, metrics.editCount);
    });
    
    // When accessing from the browser, we need to use host machine's address
    // and the port where the backend is exposed
    const apiUrl = 'http://localhost:8080';
    console.log('Making API request to:', apiUrl);
    
    try {
      // Use our tracing wrapper for the API call
      await withTracing(
        `${apiUrl}/auth/register`, 
        'POST',
        async (traceHeaders) => {
          // Configure axios with proper headers for CORS and tracing
          const response = await axios.post(
            `${apiUrl}/auth/register`, 
            {
              ...form,
              // Include timing metrics in the request
              _metrics: {
                totalTimeMs: totalTimeOnPageMs,
                interactionTimeMs: totalInteractionTimeMs,
                fieldInteractions: Object.entries(fieldInteractions).reduce((acc, [key, value]) => {
                  acc[key] = {
                    focusCount: value.focusCount,
                    editCount: value.editCount,
                    timeMs: value.totalTimeMs
                  };
                  return acc;
                }, {} as Record<string, any>)
              }
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': window.location.origin,
                // Add trace headers and detailed metrics
                ...traceHeaders,
                'X-Registration-Time-Ms': totalTimeOnPageMs.toString(),
                'X-Form-Interaction-Time-Ms': totalInteractionTimeMs.toString(),
                // Include field-level metrics in custom headers
                'X-Username-Time-Ms': fieldInteractions.username?.totalTimeMs.toString() || '0',
                'X-Username-Focus-Count': fieldInteractions.username?.focusCount.toString() || '0',
                'X-Username-Edit-Count': fieldInteractions.username?.editCount.toString() || '0',
                'X-Email-Time-Ms': fieldInteractions.email?.totalTimeMs.toString() || '0',
                'X-Email-Focus-Count': fieldInteractions.email?.focusCount.toString() || '0',
                'X-Email-Edit-Count': fieldInteractions.email?.editCount.toString() || '0',
                'X-Password-Time-Ms': fieldInteractions.password?.totalTimeMs.toString() || '0',
                'X-Password-Focus-Count': fieldInteractions.password?.focusCount.toString() || '0',
                'X-Password-Edit-Count': fieldInteractions.password?.editCount.toString() || '0'
              },
              // Add CORS settings
              withCredentials: true
            }
          );
          return response;
        },
        registrationSpan
      );
      
      setMessage("Registration successful");
      setForm({ username: "", email: "", password: "" });
      
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Error during registration. Please try again.");
      
      // Add error information to the span
      if (error instanceof Error) {
        registrationSpan.setAttribute('error', true);
        registrationSpan.setAttribute('error.message', error.message);
      }
    } finally {
      // End the span when we're done
      registrationSpan.end();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-black fixed inset-0">
      <div className="w-full max-w-md px-4 pt-36 pb-8 z-10">
        {/* Logo or branding element */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-1">Elo Insight</h1>
          <p className="text-accent-400">Track your gaming performance across platforms</p>
        </div>
        
        <Card variant="bordered" className="w-full border-primary-700 bg-surface-dark">
          <CardContent>
            <h2 className="text-2xl font-bold text-white mb-6">Create an account</h2>
            
            {message && (
              <div className="bg-accent-900/40 text-accent-300 p-3 mb-6 border-l-4 border-accent-600">
                {message}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-content-secondary mb-1.5">
                  Username
                </label>
                <Input 
                  id="username"
                  type="text" 
                  name="username" 
                  placeholder="Choose a username" 
                  value={form.username} 
                  onChange={handleInputChange} 
                  onFocus={() => handleFieldFocus('username')}
                  onBlur={() => handleFieldBlur('username')}
                  className="bg-primary-950 border-primary-800 text-white focus:border-accent-600"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-content-secondary mb-1.5">
                  Email address
                </label>
                <Input 
                  id="email"
                  type="email" 
                  name="email" 
                  placeholder="Enter your email" 
                  value={form.email} 
                  onChange={handleInputChange} 
                  onFocus={() => handleFieldFocus('email')}
                  onBlur={() => handleFieldBlur('email')}
                  className="bg-primary-950 border-primary-800 text-white focus:border-accent-600"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-content-secondary mb-1.5">
                  Password
                </label>
                <Input 
                  id="password"
                  type="password" 
                  name="password" 
                  placeholder="Create a strong password" 
                  value={form.password} 
                  onChange={handleInputChange} 
                  onFocus={() => handleFieldFocus('password')}
                  onBlur={() => handleFieldBlur('password')}
                  className="bg-primary-950 border-primary-800 text-white focus:border-accent-600"
                />
                <p className="mt-1.5 text-xs text-primary-400">Password must be at least 8 characters</p>
              </div>
              
              <Button 
                className="w-full mt-6 bg-accent-600 hover:bg-accent-700 text-white border-none" 
                size="lg"
              >
                Create Account
              </Button>
              
              <p className="text-center text-primary-400 mt-4">
                Already have an account?{" "}
                <a href="/login" className="text-accent-500 hover:text-accent-400 transition-colors">
                  Sign in
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
