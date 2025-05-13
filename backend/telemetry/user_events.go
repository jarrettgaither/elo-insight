package telemetry

import (
	"context"
	"time"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

// UserEvent types for consistent naming in traces
const (
	RegistrationStarted    = "registration.started"
	RegistrationValidated  = "registration.validated"
	RegistrationProcessing = "registration.processing"
	PasswordHashed        = "registration.password_hashed"
	DatabaseStoring       = "registration.database_storing"
	RegistrationCompleted = "registration.completed"
	RegistrationFailed    = "registration.failed"
)

// TraceRegistrationFlow creates detailed spans and events for the user registration process
func TraceRegistrationFlow(ctx context.Context, email, username string) context.Context {
	// Start the parent span for the entire registration process
	ctx, span := StartSpan(ctx, "user.registration.flow")
	span.SetAttributes(
		attribute.String("user.email", email),
		attribute.String("user.username", username),
		attribute.String("event.name", "user_registration"),
		attribute.String("event.domain", "auth"),
	)
	
	// Add start event with timestamp
	AddEvent(ctx, RegistrationStarted, 
		attribute.String("timestamp", time.Now().Format(time.RFC3339)),
	)
	
	return ctx
}

// RecordRegistrationStarted adds an event when registration process begins
func RecordRegistrationStarted(ctx context.Context) {
	span := trace.SpanFromContext(ctx)
	startTime := time.Now().UTC()
	span.AddEvent("registration.started", trace.WithAttributes(
		attribute.String("timestamp", startTime.Format(time.RFC3339)),
	))
	
	// Store the start time in the span for later duration calculation
	span.SetAttributes(attribute.String("registration.start_time", startTime.Format(time.RFC3339)))
}

// RecordRegistrationValidated adds an event when registration is validated
func RecordRegistrationValidated(ctx context.Context, step string) {
	span := trace.SpanFromContext(ctx)
	span.AddEvent("registration.validated", trace.WithAttributes(
		attribute.String("step", step),
		attribute.String("timestamp", time.Now().UTC().Format(time.RFC3339)),
	))
}

// RecordRegistrationProcessing adds an event when registration is being processed
func RecordRegistrationProcessing(ctx context.Context) {
	span := trace.SpanFromContext(ctx)
	span.AddEvent("registration.processing", trace.WithAttributes(
		attribute.String("timestamp", time.Now().UTC().Format(time.RFC3339)),
	))
}

// RecordRegistrationDatabaseStoring adds an event when registration is being stored in database
func RecordRegistrationDatabaseStoring(ctx context.Context) {
	span := trace.SpanFromContext(ctx)
	span.AddEvent("registration.database_storing", trace.WithAttributes(
		attribute.String("timestamp", time.Now().UTC().Format(time.RFC3339)),
	))
}

// RecordRegistrationCompleted adds completion details including total processing time
func RecordRegistrationCompleted(ctx context.Context, userID uint, success bool) {
	span := trace.SpanFromContext(ctx)
	endTime := time.Now().UTC()
	
	// Get the start time if available (as string)
	startTimeStr := span.SpanContext().TraceState().Get("registration.start_time")
	span.AddEvent("registration.completed", trace.WithAttributes(
		attribute.String("timestamp", endTime.Format(time.RFC3339)),
		attribute.Int64("user.id", int64(userID)),
		attribute.Bool("success", success),
	))
	
	// Calculate and record the total server processing time
	if startTimeStr != "" {
		if startTime, err := time.Parse(time.RFC3339, startTimeStr); err == nil {
			processingDuration := endTime.Sub(startTime)
			span.SetAttributes(
				attribute.Int64("registration.server_processing_ms", processingDuration.Milliseconds()),
				attribute.Float64("registration.server_processing_s", processingDuration.Seconds()),
			)
		}
	}
}

// RecordRegistrationClientTiming records frontend timing information passed from the client
func RecordRegistrationClientTiming(ctx context.Context, clientTotalTimeMs int64, formInteractionTimeMs int64) {
	span := trace.SpanFromContext(ctx)
	span.SetAttributes(
		attribute.Int64("registration.client_total_ms", clientTotalTimeMs),
		attribute.Int64("registration.form_interaction_ms", formInteractionTimeMs),
		attribute.Float64("registration.client_total_s", float64(clientTotalTimeMs)/1000),
		attribute.Float64("registration.form_interaction_s", float64(formInteractionTimeMs)/1000),
	)

	// Add a detailed event for analytics
	span.AddEvent("registration.client_timing", trace.WithAttributes(
		attribute.Int64("total_ms", clientTotalTimeMs),
		attribute.Int64("form_time_ms", formInteractionTimeMs),
		attribute.String("timestamp", time.Now().UTC().Format(time.RFC3339)),
	))
}

// TraceRegistrationComplete marks successful completion of registration
func TraceRegistrationComplete(ctx context.Context, userID uint) {
	span := trace.SpanFromContext(ctx)
	
	// Add user ID after successful registration
	span.SetAttributes(attribute.Int("user.id", int(userID)))
	
	// Add completion event with timestamp
	AddEvent(ctx, RegistrationCompleted,
		attribute.String("timestamp", time.Now().Format(time.RFC3339)),
		attribute.Int("user.id", int(userID)),
		attribute.Bool("success", true),
	)
	
	// End the span
	span.End()
}

// TraceRegistrationError records a registration failure
func TraceRegistrationError(ctx context.Context, step string, err error) {
	span := trace.SpanFromContext(ctx)
	
	// Add failure attributes
	span.SetAttributes(
		attribute.String("error.step", step),
		attribute.String("error.message", err.Error()),
		attribute.Bool("success", false),
	)
	
	// Record error on span
	RecordError(ctx, err)
	
	// Add failure event with timestamp
	AddEvent(ctx, RegistrationFailed,
		attribute.String("timestamp", time.Now().Format(time.RFC3339)),
		attribute.String("step", step),
		attribute.String("error", err.Error()),
	)
	
	// End the span
	span.End()
}
