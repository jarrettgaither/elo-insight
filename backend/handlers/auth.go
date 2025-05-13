package handlers

import (
	"log"
	"net/http"
	"strconv"

	"elo-insight/backend/database"
	"elo-insight/backend/middleware"
	"elo-insight/backend/models"
	"elo-insight/backend/telemetry"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel/attribute"
	"golang.org/x/crypto/bcrypt"
)

// Function to register a new user
func Register(c *gin.Context) {
	// Start a new span for the registration process
	ctx, span := telemetry.StartSpan(c.Request.Context(), "user.register")
	defer span.End()

	// Add request attributes to span
	span.SetAttributes(
		attribute.String("request.method", c.Request.Method),
		attribute.String("request.path", c.Request.URL.Path),
		attribute.String("request.user_agent", c.Request.UserAgent()),
		attribute.String("http.client_ip", c.ClientIP()),
		attribute.String("event.name", "user_registration"),
		attribute.String("event.domain", "auth"),
	)

	// Record the start of registration process with timestamps
	telemetry.RecordRegistrationStarted(ctx)
	
	// Add beginning validation event
	telemetry.RecordRegistrationValidated(ctx, "beginning_validation")

	// Parse request data
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		// Record error in the span
		span.SetAttributes(attribute.String("error", "validation_error"))
		span.SetAttributes(attribute.String("error.message", err.Error()))
		
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Extract client-side timing metrics from headers if available
	clientTotalTimeStr := c.GetHeader("X-Registration-Time-Ms")
	formInteractionTimeStr := c.GetHeader("X-Form-Interaction-Time-Ms")
	
	// Initialize variables to store parsed values
	var clientTotalTime, formInteractionTime int64
	
	if clientTotalTimeStr != "" && formInteractionTimeStr != "" {
		var err1, err2 error
		clientTotalTime, err1 = strconv.ParseInt(clientTotalTimeStr, 10, 64)
		formInteractionTime, err2 = strconv.ParseInt(formInteractionTimeStr, 10, 64)
		
		if err1 == nil && err2 == nil {
			// Record client-side timing data
			telemetry.RecordRegistrationClientTiming(ctx, clientTotalTime, formInteractionTime)
		}
	}

	// Add user information to the span
	span.SetAttributes(
		attribute.String("user.email", user.Email),
		attribute.String("user.username", user.Username),
	)
	
	// Record user registration timing metrics
	if clientTotalTime > 0 && formInteractionTime > 0 {
		span.SetAttributes(
			attribute.Int64("user.registration.total_time_ms", clientTotalTime),
			attribute.Int64("user.registration.interaction_time_ms", formInteractionTime),
		)
		
		// Extract and record field-level metrics
		// Username metrics
		usernameTimeStr := c.GetHeader("X-Username-Time-Ms")
		usernameEditCountStr := c.GetHeader("X-Username-Edit-Count")
		usernameFocusCountStr := c.GetHeader("X-Username-Focus-Count")
		
		if usernameTimeStr != "" && usernameEditCountStr != "" && usernameFocusCountStr != "" {
			usernameTime, _ := strconv.ParseInt(usernameTimeStr, 10, 64)
			usernameEditCount, _ := strconv.ParseInt(usernameEditCountStr, 10, 64)
			usernameFocusCount, _ := strconv.ParseInt(usernameFocusCountStr, 10, 64)
			
			span.SetAttributes(
				attribute.Int64("user.form.username.time_ms", usernameTime),
				attribute.Int64("user.form.username.edit_count", usernameEditCount),
				attribute.Int64("user.form.username.focus_count", usernameFocusCount),
			)
		}
		
		// Email metrics
		emailTimeStr := c.GetHeader("X-Email-Time-Ms")
		emailEditCountStr := c.GetHeader("X-Email-Edit-Count")
		emailFocusCountStr := c.GetHeader("X-Email-Focus-Count")
		
		if emailTimeStr != "" && emailEditCountStr != "" && emailFocusCountStr != "" {
			emailTime, _ := strconv.ParseInt(emailTimeStr, 10, 64)
			emailEditCount, _ := strconv.ParseInt(emailEditCountStr, 10, 64)
			emailFocusCount, _ := strconv.ParseInt(emailFocusCountStr, 10, 64)
			
			span.SetAttributes(
				attribute.Int64("user.form.email.time_ms", emailTime),
				attribute.Int64("user.form.email.edit_count", emailEditCount),
				attribute.Int64("user.form.email.focus_count", emailFocusCount),
			)
		}
		
		// Password metrics
		passwordTimeStr := c.GetHeader("X-Password-Time-Ms")
		passwordEditCountStr := c.GetHeader("X-Password-Edit-Count")
		passwordFocusCountStr := c.GetHeader("X-Password-Focus-Count")
		
		if passwordTimeStr != "" && passwordEditCountStr != "" && passwordFocusCountStr != "" {
			passwordTime, _ := strconv.ParseInt(passwordTimeStr, 10, 64)
			passwordEditCount, _ := strconv.ParseInt(passwordEditCountStr, 10, 64)
			passwordFocusCount, _ := strconv.ParseInt(passwordFocusCountStr, 10, 64)
			
			span.SetAttributes(
				attribute.Int64("user.form.password.time_ms", passwordTime),
				attribute.Int64("user.form.password.edit_count", passwordEditCount),
				attribute.Int64("user.form.password.focus_count", passwordFocusCount),
			)
		}
	}

	// Start a child span for parsing the request
	_, parseSpan := telemetry.StartSpan(ctx, "user.register.parse_request")
	parseSpan.SetAttributes(
		attribute.String("user.email", user.Email),
		attribute.String("user.username", user.Username),
		attribute.String("validation.result", "success"),
	)
	parseSpan.End()

	// Log the registration attempt
	log.Printf("Registering user: %s", user.Email)

	// Add processing event
	telemetry.RecordRegistrationProcessing(ctx)

	// Start a child span for password hashing
	_, hashSpan := telemetry.StartSpan(ctx, "user.register.hash_password")
	hashSpan.SetAttributes(
		attribute.String("password.operation", "hashing"),
		attribute.String("hashing.algorithm", "bcrypt"),
	)
	
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		hashSpan.SetAttributes(attribute.String("error", "hashing_error"))
		hashSpan.SetAttributes(attribute.String("error.message", err.Error()))
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}
	
	// Record successful password hashing
	telemetry.AddEvent(ctx, "registration.password_hashed")
	hashSpan.End()

	// Set the hashed password in the user model
	user.Password = string(hashedPassword)

	// Add database storing event
	telemetry.RecordRegistrationDatabaseStoring(ctx)
	
	// Start a child span for database operations
	dbCtx, dbSpan := telemetry.StartSpan(ctx, "user.register.database_create")
	dbSpan.SetAttributes(
		attribute.String("db.operation", "insert"),
		attribute.String("db.table", "users"),
		attribute.String("user.email", user.Email),
	)

	// Create user in database - pass the trace context
	result := database.DB.WithContext(dbCtx).Create(&user)
	if result.Error != nil {
		dbSpan.SetAttributes(attribute.String("error", "database_error"))
		dbSpan.SetAttributes(attribute.String("error.message", result.Error.Error()))
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Record success metrics
	dbSpan.SetAttributes(
		attribute.Int64("db.rows_affected", result.RowsAffected),
		attribute.Int64("user.id", int64(user.ID)),
	)
	dbSpan.End()

	// Record successful registration completion with timing data
	telemetry.RecordRegistrationCompleted(ctx, user.ID, true)

	// Also record legacy completion event
	telemetry.TraceRegistrationComplete(ctx, user.ID)

	// Log success
	log.Printf("User registered successfully: %s\n", user.Email)

	// Return success
	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully"})
}

// Function to login user and issue JWT token
func Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Println("ERROR: Invalid request data:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Println("User attempting login:", input.Email)

	var user models.User
	result := database.DB.Where("email = ?", input.Email).First(&user)
	if result.Error != nil {
		log.Println("ERROR: User not found for email:", input.Email)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !user.CheckPassword(input.Password) {
		log.Println("ERROR: Password mismatch for user:", input.Email)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := middleware.GenerateJWT(user)
	if err != nil {
		log.Println("ERROR: Failed to generate JWT:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	log.Println("User logged in successfully:", input.Email)

	// Send JWT as an HttpOnly cookie
	c.SetCookie("token", token, 86400, "/", "localhost", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Login successful"})
}

// Function to logout user
func Logout(c *gin.Context) {
	// Expire the token cookie by setting MaxAge to -1
	c.SetCookie("token", "", -1, "/", "localhost", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logout successful"})
}
