/**
 * Simplified telemetry helper for frontend tracing
 * This version logs to console but doesn't break API calls
 */

// Static trace information
const serviceInfo = {
  name: 'elo-insight-frontend',
  version: '1.0.0'
};

// Generate a simple ID for correlation
const generateId = () => {
  return Math.random().toString(16).substring(2);
};

// Helper to trace API calls
export const withTracing = async (
  endpoint: string,
  method: string,
  requestFn: (headers?: Record<string, string>) => Promise<any>,
  data?: any
) => {
  const traceId = generateId();
  const spanId = generateId();
  const startTime = Date.now();
  
  // Log the operation start
  console.log(`[Telemetry] Start operation: ${method} ${endpoint}`, {
    traceId,
    spanId,
    timestamp: new Date().toISOString(),
    service: serviceInfo.name,
    method,
    endpoint
  });

  try {
    // Use W3C trace context headers for proper propagation to backend
    const traceHeaders = {
      'traceparent': `00-${traceId.padEnd(32, '0')}-${spanId.padEnd(16, '0')}-01`,
      'X-Trace-ID': traceId,
      'X-Span-ID': spanId
    };
    
    // Execute the API request
    const result = await requestFn(traceHeaders);
    
    // Log completion
    console.log(`[Telemetry] Completed operation: ${method} ${endpoint}`, {
      traceId,
      spanId,
      duration: Date.now() - startTime,
      success: true,
      status: 'OK'
    });
    
    return result;
  } catch (error: any) {
    // Log error
    console.error(`[Telemetry] Error in operation: ${method} ${endpoint}`, {
      traceId,
      spanId,
      duration: Date.now() - startTime,
      success: false,
      error: error.message,
      status: error.response?.status || 'ERROR'
    });
    
    throw error;
  }
};

// Create a simplified span
export const startSpan = (name: string) => {
  const traceId = generateId();
  const spanId = generateId();
  
  console.log(`[Telemetry] Started span: ${name}`, {
    traceId,
    spanId,
    timestamp: new Date().toISOString()
  });
  
  return {
    traceId,
    spanId,
    end: () => {
      console.log(`[Telemetry] Ended span: ${name}`, {
        traceId,
        spanId,
        timestamp: new Date().toISOString()
      });
    },
    setAttribute: (key: string, value: any) => {
      console.log(`[Telemetry] Attribute for ${name}: ${key}=${value}`, { traceId, spanId });
    },
    setStatus: (status: any) => {
      console.log(`[Telemetry] Status for ${name}: ${JSON.stringify(status)}`, { traceId, spanId });
    }
  };
};

// Default export to maintain compatibility
export default {
  startSpan,
  withTracing
};
