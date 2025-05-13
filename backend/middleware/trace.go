package middleware

import (
	"context"
	"elo-insight/backend/telemetry"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/propagation"
)

// TraceContext is middleware that extracts trace context from incoming HTTP requests
// and ensures it's propagated throughout the request lifecycle
func TraceContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract the context from the incoming request headers
		propagator := otel.GetTextMapPropagator()
		ctx := propagator.Extract(c.Request.Context(), propagation.HeaderCarrier(c.Request.Header))
		
		// Add key request attributes to span
		telemetry.AddAttributes(ctx,
			attribute.String("http.method", c.Request.Method),
			attribute.String("http.url", c.Request.URL.String()),
			attribute.String("http.user_agent", c.Request.UserAgent()),
			attribute.String("http.client_ip", c.ClientIP()),
		)

		// Add handler name attribute to distinguish different API endpoints
		if c.HandlerName() != "" {
			telemetry.AddAttributes(ctx, attribute.String("http.handler", c.HandlerName()))
		}

		// Store the updated context in Gin
		c.Request = c.Request.WithContext(ctx)

		// Process the request (and collect spans)
		c.Next()

		// Add response status code to the span
		telemetry.AddAttributes(ctx, attribute.Int("http.status_code", c.Writer.Status()))
	}
}

// ExtractTraceContext extracts the trace context from the Gin context
func ExtractTraceContext(c *gin.Context) context.Context {
	return c.Request.Context()
}
