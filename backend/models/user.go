package models

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User represents a user in the database
type User struct {
	gorm.Model
	Username   string `gorm:"not null"`
	Email      string `gorm:"not null"`
	Password   string `gorm:"not null"`
	SteamID    string `gorm:"default:''"`
	RiotID     string `gorm:"default:''"`
	EAUsername string `gorm:"default:''"` // EA account username for Apex Legends
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
