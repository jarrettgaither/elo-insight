package models

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User represents a user in the database
type User struct {
	gorm.Model
	Username      string `gorm:"not null" json:"username"`
	Email         string `gorm:"not null" json:"email"`
	Password      string `gorm:"not null" json:"password"`
	SteamID       string `gorm:"default:''" json:"steam_id"`
	RiotID        string `gorm:"default:''" json:"riot_id"` // Deprecated, use RiotGameName, RiotTagline, RiotPUUID
	RiotGameName  string `gorm:"default:''" json:"riot_game_name"`
	RiotTagline   string `gorm:"default:''" json:"riot_tagline"`
	RiotPUUID     string `gorm:"default:''" json:"riot_puuid"`
	EAUsername    string `gorm:"default:''" json:"ea_username"` // EA account username for Apex Legends
	XboxID        string `gorm:"default:''" json:"xbox_id"` // Xbox Live Gamertag
	PlayStationID string `gorm:"default:''" json:"playstation_id"` // PlayStation Network ID
}

// Hashes the user's password before storing it
func (u *User) HashPassword() error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// CheckPassword compares a hashed password with a plain text password
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}
