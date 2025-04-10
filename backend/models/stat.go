package models

import "gorm.io/gorm"

type UserStat struct {
	gorm.Model
	UserID   uint   `gorm:"not null"`
	Game     string `gorm:"not null"`
	Platform string `gorm:"not null"`
}
