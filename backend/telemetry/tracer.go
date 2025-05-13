package telemetry

import (
	"context"
	"log"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

var tracer trace.Tracer

// Initialize creates a new tracer from the global trace provider
func Initialize(serviceName string) {
	tracer = otel.GetTracerProvider().Tracer(serviceName)
}

// StartSpan starts a new span with the given name, optionally as a child of the context
func StartSpan(ctx context.Context, spanName string) (context.Context, trace.Span) {
	return tracer.Start(ctx, spanName)
}

// AddEvent adds an event to the span in the current context
func AddEvent(ctx context.Context, eventName string, attributes ...attribute.KeyValue) {
	span := trace.SpanFromContext(ctx)
	span.AddEvent(eventName, trace.WithAttributes(attributes...))
}

// AddAttributes adds attributes to the span in the current context
func AddAttributes(ctx context.Context, attributes ...attribute.KeyValue) {
	span := trace.SpanFromContext(ctx)
	span.SetAttributes(attributes...)
}

// RecordError records an error on the span in the current context
func RecordError(ctx context.Context, err error, options ...trace.EventOption) {
	span := trace.SpanFromContext(ctx)
	span.RecordError(err, options...)
	span.SetStatus(codes.Error, err.Error())
}

// LogAndRecordError logs an error and records it on the span
func LogAndRecordError(ctx context.Context, message string, err error) {
	log.Printf("%s: %v", message, err)
	RecordError(ctx, err)
}

// End ends the span in the current context
func End(ctx context.Context) {
	span := trace.SpanFromContext(ctx)
	span.End()
}
