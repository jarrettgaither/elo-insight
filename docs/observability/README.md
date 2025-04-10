# Observability with OpenTelemetry

This document outlines the observability strategy for Elo Insight using OpenTelemetry with OpenObserve.

## Overview

OpenTelemetry (OTEL) provides a standardized way to collect and export telemetry data, including:
- Traces
- Metrics
- Logs

By implementing OpenTelemetry in Elo Insight, we gain:
- End-to-end visibility across services
- Performance monitoring
- Error detection and troubleshooting
- User experience insights

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  React Frontend │──┐   │   Go Backend    │──┐   │   PostgreSQL    │
│  (instrumented) │  │   │  (instrumented) │  │   │  (instrumented) │
└─────────────────┘  │   └─────────────────┘  │   └─────────────────┘
                     │                        │
                     ▼                        ▼
              ┌─────────────────────────────────────┐
              │                                     │
              │        OpenTelemetry Collector      │
              │                                     │
              └─────────────────────────────────────┘
                                │                
                                ▼                
                    ┌─────────────────────────┐
                    │                         │
                    │       OpenObserve       │
                    │                         │
                    └─────────────────────────┘
```

## OpenTelemetry Collector

The OpenTelemetry Collector will be deployed as a containerized service alongside our application components. It will:

1. Receive telemetry data from instrumented services
2. Process and transform the data
3. Export the data to OpenObserve

### Collector Configuration

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024

  memory_limiter:
    check_interval: 1s
    limit_mib: 1000
    spike_limit_mib: 200

exporters:
  otlphttp:
    endpoint: "http://openobserve:5080/api/default"
    headers:
      Authorization: "Basic ${OPENOBSERVE_AUTH_HEADER}"

  logging:
    loglevel: debug

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlphttp, logging]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlphttp, logging]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlphttp, logging]
```

## Backend Instrumentation (Go)

The Go backend will be instrumented using the OpenTelemetry Go SDK:

```go
package main

import (
	"context"
	"log"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
	"google.golang.org/grpc"
)

func initTracer() func() {
	// Create OTLP exporter
	ctx := context.Background()
	conn, err := grpc.DialContext(ctx, "otel-collector:4317", grpc.WithInsecure())
	if err != nil {
		log.Fatalf("Failed to create gRPC connection: %v", err)
	}

	exporter, err := otlptracegrpc.New(ctx, otlptracegrpc.WithGRPCConn(conn))
	if err != nil {
		log.Fatalf("Failed to create exporter: %v", err)
	}

	// Create resource with service information
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceNameKey.String("elo-insight-backend"),
			semconv.ServiceVersionKey.String("1.0.0"),
		),
	)
	if err != nil {
		log.Fatalf("Failed to create resource: %v", err)
	}

	// Create trace provider
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	return func() {
		if err := tp.Shutdown(ctx); err != nil {
			log.Fatalf("Error shutting down tracer provider: %v", err)
		}
	}
}

// Example usage in handler
func exampleHandler(c *gin.Context) {
	ctx := c.Request.Context()
	tracer := otel.Tracer("elo-insight/handlers")
	
	ctx, span := tracer.Start(ctx, "GetUserStats")
	defer span.End()
	
	// Add attributes to span
	span.SetAttributes(
		attribute.String("user.id", userID),
		attribute.String("game", game),
	)
	
	// Handle request...
	
	// Record errors
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
	}
}
```

## Frontend Instrumentation (React)

The React frontend will be instrumented using the OpenTelemetry JavaScript SDK:

```typescript
// src/utils/telemetry.ts
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export const initTelemetry = () => {
  const exporter = new OTLPTraceExporter({
    url: '/api/v1/traces', // Will be proxied to the collector
  });

  const provider = new WebTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'elo-insight-frontend',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    }),
  });

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register({
    contextManager: new ZoneContextManager(),
    propagator: new W3CTraceContextPropagator(),
  });

  // Instrument fetch
  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [
          /http:\/\/localhost:.*/,
          new RegExp(`${process.env.REACT_APP_API_URL}.*`),
        ],
      }),
    ],
  });

  return provider;
};

// Custom hook for creating spans
export const useTracing = () => {
  const tracer = provider.getTracer('elo-insight-frontend');
  
  const traceAction = (name, fn, attributes = {}) => {
    return tracer.startActiveSpan(name, async (span) => {
      try {
        span.setAttributes(attributes);
        const result = await fn();
        span.end();
        return result;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.end();
        throw error;
      }
    });
  };
  
  return { traceAction };
};
```

## Database Monitoring

PostgreSQL will be monitored using:

1. Custom instrumentation in database access code
2. OpenTelemetry automatic instrumentation for database clients

## Semantic Conventions

We will follow the OpenTelemetry semantic conventions for consistent naming:

### Trace Attributes

- `service.name`: Name of the service (e.g., "elo-insight-backend")
- `service.version`: Version of the service
- `http.method`: HTTP method of the request
- `http.url`: Full URL of the request
- `http.status_code`: HTTP status code
- `db.system`: Database system (e.g., "postgresql")
- `db.operation`: Database operation (e.g., "select", "insert")
- `user.id`: ID of the user making the request

### Custom Attributes

- `game.platform`: Gaming platform (e.g., "steam", "riot")
- `game.name`: Game name (e.g., "cs2", "lol")
- `stat.type`: Type of statistic being tracked

## OpenObserve Setup

OpenObserve is a cloud-native observability platform that will be used to store and visualize our telemetry data.

### Docker Compose Configuration

```yaml
services:
  # Existing services...
  
  # OpenTelemetry Collector
  otel-collector:
    image: otel/opentelemetry-collector:latest
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./observability/otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"  # OTLP gRPC
      - "4318:4318"  # OTLP HTTP
    environment:
      - OPENOBSERVE_AUTH_HEADER=${OPENOBSERVE_AUTH_HEADER}
    depends_on:
      - openobserve
      
  # OpenObserve for telemetry storage and visualization
  openobserve:
    image: openobserve/openobserve:latest
    ports:
      - "5080:5080"  # UI and API
    environment:
      - ZO_ROOT_USER_EMAIL=admin@example.com
      - ZO_ROOT_USER_PASSWORD=admin123
      - ZO_LOCAL_STORAGE_PATH=/data
    volumes:
      - openobserve-data:/data
      
volumes:
  openobserve-data:
```

### OpenObserve Features

1. **Unified Observability**: Single platform for logs, metrics, and traces
2. **Dashboards**: Create custom dashboards for application monitoring
3. **Alerts**: Configure alerts based on thresholds and patterns
4. **Query Language**: SQL-based query language for data exploration
5. **User Management**: Role-based access control

## OpenObserve Dashboard Examples

We will create the following dashboards in OpenObserve:

1. **Application Overview**: Key metrics and health indicators
2. **User Experience**: Frontend performance and error rates
3. **API Performance**: Backend endpoint latency and throughput
4. **Database Performance**: Query performance and connection metrics
5. **Error Tracking**: Error rates and details across services

## Implementation Plan

1. Set up the OpenTelemetry Collector
2. Deploy OpenObserve container
3. Instrument the Go backend
4. Instrument the React frontend
5. Configure OpenObserve dashboards and alerts
6. Validate end-to-end tracing
