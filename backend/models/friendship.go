package models

import (
	"gorm.io/gorm"
)

// Friendship represents a friendship relationship between users
type Friendship struct {
	gorm.Model
	UserID      uint   `gorm:"not null;index"`          // The user who has the friend
	FriendID    uint   `gorm:"not null;index"`          // The user who is the friend
	Status      string `gorm:"not null;default:'pending'"` // "pending", "accepted", "rejected"
	RequestedBy uint   `gorm:"not null"`                // Which user initiated the request
}

// FriendshipResponse is used for returning friendship data with user details
type FriendshipResponse struct {
	ID           uint   `json:"id"`
	UserID       uint   `json:"user_id"`
	FriendID     uint   `json:"friend_id"`
	Username     string `json:"username"`     // Friend's username
	Email        string `json:"email"`        // Friend's email
	Status       string `json:"status"`       // Friendship status
	RequestedBy  uint   `json:"requested_by"` // Who initiated the request
	CreatedAt    string `json:"created_at"`
}
