package handlers

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"elo-insight/backend/database"
	"elo-insight/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetFriends retrieves the list of friends for the authenticated user
func GetFriends(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get all accepted friendships where the user is either the requester or the recipient
	var friendships []models.Friendship
	if err := database.DB.Where(
		"(user_id = ? OR friend_id = ?) AND status = ?", 
		userID, userID, "accepted").Find(&friendships).Error; err != nil {
		log.Println("Failed to fetch friendships:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch friends"})
		return
	}

	var friendResponses []models.FriendshipResponse
	for _, friendship := range friendships {
		var friendID uint
		if friendship.UserID == userID.(uint) {
			friendID = friendship.FriendID
		} else {
			friendID = friendship.UserID
		}

		// Get friend's details
		var friend models.User
		if err := database.DB.Select("id, username, email").Where("id = ?", friendID).First(&friend).Error; err != nil {
			log.Println("Failed to fetch friend details:", err)
			continue
		}

		friendResponses = append(friendResponses, models.FriendshipResponse{
			ID:          friendship.ID,
			UserID:      friendship.UserID,
			FriendID:    friendship.FriendID,
			Username:    friend.Username,
			Email:       friend.Email,
			Status:      friendship.Status,
			RequestedBy: friendship.RequestedBy,
			CreatedAt:   friendship.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	c.JSON(http.StatusOK, friendResponses)
}

// SendFriendRequest creates a new friend request
func SendFriendRequest(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input struct {
		FriendID uint `json:"friend_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Println("Invalid request data:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Check if the friend exists
	var friend models.User
	if err := database.DB.Where("id = ?", input.FriendID).First(&friend).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			log.Println("Database error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check user"})
		}
		return
	}

	// Check if friend request already exists
	var existingFriendship models.Friendship
	result := database.DB.Where(
		"(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)", 
		userID, input.FriendID, input.FriendID, userID).First(&existingFriendship)
	
	if result.Error == nil {
		// Request already exists
		c.JSON(http.StatusConflict, gin.H{"error": "Friend request already exists"})
		return
	} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		// Database error
		log.Println("Database error:", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing requests"})
		return
	}

	// Create friend request
	friendship := models.Friendship{
		UserID:      userID.(uint),
		FriendID:    input.FriendID,
		Status:      "pending",
		RequestedBy: userID.(uint),
	}

	if err := database.DB.Create(&friendship).Error; err != nil {
		log.Println("Failed to create friend request:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send friend request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Friend request sent successfully"})
}

// RespondToFriendRequest handles accepting or rejecting a friend request
func RespondToFriendRequest(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get the friendship ID from URL
	friendshipID := c.Param("id")
	if friendshipID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing friendship ID"})
		return
	}

	var input struct {
		Action string `json:"action" binding:"required"` // "accept" or "reject"
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Println("Invalid request data:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Validate action
	if input.Action != "accept" && input.Action != "reject" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Action must be 'accept' or 'reject'"})
		return
	}

	// Get the friendship
	var friendship models.Friendship
	id, err := strconv.ParseUint(friendshipID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid friendship ID"})
		return
	}

	// Find the friendship and check if the user is the recipient
	if err := database.DB.Where("id = ? AND friend_id = ? AND status = ?", 
		id, userID, "pending").First(&friendship).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Friend request not found or you're not authorized to respond"})
		} else {
			log.Println("Database error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check friend request"})
		}
		return
	}

	// Update the friendship status
	status := "rejected"
	if input.Action == "accept" {
		status = "accepted"
	}

	if err := database.DB.Model(&friendship).Update("status", status).Error; err != nil {
		log.Println("Failed to update friendship status:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Friend request " + status + " successfully"})
}

// RemoveFriend deletes a friendship relationship
func RemoveFriend(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get the friendship ID from URL
	friendshipID := c.Param("id")
	if friendshipID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing friendship ID"})
		return
	}

	id, err := strconv.ParseUint(friendshipID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid friendship ID"})
		return
	}

	// Verify the user is part of this friendship
	var friendship models.Friendship
	if err := database.DB.Where(
		"id = ? AND (user_id = ? OR friend_id = ?)", 
		id, userID, userID).First(&friendship).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Friendship not found or you're not authorized to remove it"})
		} else {
			log.Println("Database error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check friendship"})
		}
		return
	}

	// Delete the friendship
	if err := database.DB.Delete(&friendship).Error; err != nil {
		log.Println("Failed to delete friendship:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove friend"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Friend removed successfully"})
}

// GetFriendRequests retrieves pending friend requests for the user
func GetFriendRequests(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get all pending friendship requests where the user is the recipient
	var friendships []models.Friendship
	if err := database.DB.Where(
		"friend_id = ? AND status = ?", 
		userID, "pending").Find(&friendships).Error; err != nil {
		log.Println("Failed to fetch friend requests:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch friend requests"})
		return
	}

	var requestResponses []models.FriendshipResponse
	for _, friendship := range friendships {
		// Get requester's details
		var requester models.User
		if err := database.DB.Select("id, username, email").Where("id = ?", friendship.UserID).First(&requester).Error; err != nil {
			log.Println("Failed to fetch requester details:", err)
			continue
		}

		requestResponses = append(requestResponses, models.FriendshipResponse{
			ID:          friendship.ID,
			UserID:      friendship.UserID,
			FriendID:    friendship.FriendID,
			Username:    requester.Username,
			Email:       requester.Email,
			Status:      friendship.Status,
			RequestedBy: friendship.RequestedBy,
			CreatedAt:   friendship.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	c.JSON(http.StatusOK, requestResponses)
}

// SearchUsers searches for users by username or email for adding as friends
func SearchUsers(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get search query
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing search query"})
		return
	}

	// Search for users (excluding the current user)
	var users []models.User
	if err := database.DB.Select("id, username, email").
		Where("(username ILIKE ? OR email ILIKE ?) AND id != ?", 
			"%"+query+"%", "%"+query+"%", userID).
		Limit(10).Find(&users).Error; err != nil {
		log.Println("Failed to search users:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}

	// Don't expose password or other sensitive fields
	type UserResponse struct {
		ID       uint   `json:"id"`
		Username string `json:"username"`
		Email    string `json:"email"`
	}

	var userResponses []UserResponse
	for _, user := range users {
		userResponses = append(userResponses, UserResponse{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		})
	}

	c.JSON(http.StatusOK, userResponses)
}
