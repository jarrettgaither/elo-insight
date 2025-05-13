package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"

	"elo-insight/backend/database"
	"elo-insight/backend/middleware"
	"elo-insight/backend/routes"
	"elo-insight/backend/telemetry"

	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
)

func main() {
	// --- OpenTelemetry Initialization ---
	ctx := context.Background()
	otelEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if otelEndpoint == "" {
		otelEndpoint = "otel-collector:4317"
	}

	exp, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithEndpoint(otelEndpoint),
		otlptracegrpc.WithInsecure(),
	)
	if err != nil {
		log.Fatalf("failed to create OTLP trace exporter: %v", err)
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceNameKey.String("elo-insight-backend"),
		),
	)
	if err != nil {
		log.Fatalf("failed to create OTEL resource: %v", err)
	}

	tp := trace.NewTracerProvider(
		trace.WithBatcher(exp),
		trace.WithResource(res),
	)
	otel.SetTracerProvider(tp)
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
		defer cancel()
		if err := tp.Shutdown(ctx); err != nil {
			log.Printf("Error shutting down tracer provider: %v", err)
		}
	}()
	// --- End OpenTelemetry Initialization ---

	// Initialize our telemetry package
	telemetry.Initialize("elo-insight-backend")

	middleware.Init() // Load environment variables

	// Connect to the database
	database.ConnectDB()

	// Create a new router
	r := gin.Default()
	// Add OTEL middleware for Gin with improved configuration
	r.Use(otelgin.Middleware(
		"elo-insight-backend",
		otelgin.WithPropagators(
			otel.GetTextMapPropagator(), // Use the global text map propagator
		),
		otelgin.WithSpanNameFormatter(func(r *http.Request) string {
			return r.URL.Path // Use path as span name for better organization
		}),
	))
	// Add our custom trace context middleware to enhance spans
	r.Use(middleware.TraceContext())

	// Set up CORS middleware with enhanced configuration
	r.Use(func(c *gin.Context) {
		// Get the origin from the request
		origin := c.Request.Header.Get("Origin")
		if origin == "" {
			// If no origin is provided, allow localhost:3000 by default
			origin = "http://localhost:3000"
		}

		// Pre-flight request handling - allow the actual requesting origin
		c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Trace-ID, X-Span-ID, X-Registration-Time-Ms, X-Form-Interaction-Time-Ms, X-Username-Time-Ms, X-Username-Focus-Count, X-Username-Edit-Count, X-Email-Time-Ms, X-Email-Focus-Count, X-Email-Edit-Count, X-Password-Time-Ms, X-Password-Focus-Count, X-Password-Edit-Count, traceparent, tracestate")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400") // 24 hours
		
		// Handle pre-flight OPTIONS requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent) // 204
			return
		}

		c.Next()
	})

	// Enable debug mode for development
	gin.SetMode(gin.DebugMode)

	// Set up routes AFTER applying CORS
	routes.SetupRoutes(r)

	for _, route := range r.Routes() {
		log.Println("Registered Route:", route.Method, route.Path)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("🚀 Server running on port:", port)
	log.Fatal(r.Run(":" + port))
}
