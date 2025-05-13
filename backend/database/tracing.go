package database

import (
	"context"
	"elo-insight/backend/telemetry"
	"fmt"
	"strings"

	"go.opentelemetry.io/otel/attribute"
	"gorm.io/gorm"
)

// QueryHook is a callback function called before a SQL query is executed
func QueryHook(ctx context.Context, query string, args ...interface{}) {
	// Extract and sanitize the SQL query for tracing
	sanitizedQuery := sanitizeSQL(query)
	
	// Create a child span from the existing context
	_, span := telemetry.StartSpan(ctx, "db.query")
	defer span.End()
	
	// Add query details as attributes directly to span
	span.SetAttributes(
		attribute.String("db.system", "postgres"),
		attribute.String("db.operation", getOperationType(query)),
		attribute.String("db.statement", sanitizedQuery),
	)
	
	// If there are bind values, add them as attributes (without sensitive data)
	if len(args) > 0 {
		span.SetAttributes(attribute.Int("db.query.args_count", len(args)))
	}
}

// Initialize GORM callbacks for query tracing
func InitTracing() {
	// Register callbacks for query monitoring
	callbacks := DB.Callback()
	
	// Register create operation callback
	if err := callbacks.Create().Before("gorm:create").Register("tracing:before_create", func(db *gorm.DB) {
		QueryHook(db.Statement.Context, db.Statement.SQL.String(), db.Statement.Vars...)
	}); err != nil {
		fmt.Println("Error registering before_create callback:", err)
	}
	
	// Register query operation callback
	if err := callbacks.Query().Before("gorm:query").Register("tracing:before_query", func(db *gorm.DB) {
		QueryHook(db.Statement.Context, db.Statement.SQL.String(), db.Statement.Vars...)
	}); err != nil {
		fmt.Println("Error registering before_query callback:", err)
	}
	
	// Register update operation callback
	if err := callbacks.Update().Before("gorm:update").Register("tracing:before_update", func(db *gorm.DB) {
		QueryHook(db.Statement.Context, db.Statement.SQL.String(), db.Statement.Vars...)
	}); err != nil {
		fmt.Println("Error registering before_update callback:", err)
	}
	
	// Register delete operation callback
	if err := callbacks.Delete().Before("gorm:delete").Register("tracing:before_delete", func(db *gorm.DB) {
		QueryHook(db.Statement.Context, db.Statement.SQL.String(), db.Statement.Vars...)
	}); err != nil {
		fmt.Println("Error registering before_delete callback:", err)
	}
	
	// Register row operation callback
	if err := callbacks.Row().Before("gorm:row").Register("tracing:before_row", func(db *gorm.DB) {
		QueryHook(db.Statement.Context, db.Statement.SQL.String(), db.Statement.Vars...)
	}); err != nil {
		fmt.Println("Error registering before_row callback:", err)
	}
	
	// Register raw operation callback
	if err := callbacks.Raw().Before("gorm:raw").Register("tracing:before_raw", func(db *gorm.DB) {
		QueryHook(db.Statement.Context, db.Statement.SQL.String(), db.Statement.Vars...)
	}); err != nil {
		fmt.Println("Error registering before_raw callback:", err)
	}
}

// sanitizeSQL removes sensitive information from SQL queries
func sanitizeSQL(query string) string {
	// For simplicity, we're just returning the query
	// In a real implementation, you'd want to use a SQL parser to remove potentially
	// sensitive data like passwords, tokens, etc.
	return query
}

// getOperationType returns the type of SQL operation (SELECT, INSERT, UPDATE, DELETE)
func getOperationType(query string) string {
	// Very simple detection - in a real app you might want a more robust solution
	queryPrefix := ""
	if len(query) > 10 {
		queryPrefix = query[0:10]
	} else {
		queryPrefix = query
	}
	
	queryPrefix = strings.ToUpper(queryPrefix)
	
	switch {
	case strings.HasPrefix(queryPrefix, "SELECT"):
		return "SELECT"
	case strings.HasPrefix(queryPrefix, "INSERT"):
		return "INSERT"
	case strings.HasPrefix(queryPrefix, "UPDATE"):
		return "UPDATE"
	case strings.HasPrefix(queryPrefix, "DELETE"):
		return "DELETE"
	default:
		return "UNKNOWN"
	}
}
