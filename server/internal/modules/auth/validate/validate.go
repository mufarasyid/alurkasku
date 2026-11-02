package validate

import (
	"fmt"
	"strings"

	"github.com/mufarasyid/alurkasku/server/internal/modules/auth/domain"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
)

func Register(req domain.RegisterRequest) error {
	var missing []string
	if strings.TrimSpace(req.Name) == "" {
		missing = append(missing, "name")
	}
	if strings.TrimSpace(req.Email) == "" {
		missing = append(missing, "email")
	} else if !isValidEmail(req.Email) {
		return apperror.BadRequest("invalid email format")
	}
	if strings.TrimSpace(req.Password) == "" {
		missing = append(missing, "password")
	}
	if len(missing) > 0 {
		return apperror.BadRequest(fmt.Sprintf("field wajib diisi: %s", strings.Join(missing, ", ")))
	}
	return nil
}

func Login(req domain.LoginRequest) error {
	var missing []string
	if strings.TrimSpace(req.Email) == "" {
		missing = append(missing, "email")
	} else if !isValidEmail(req.Email) {
		return apperror.BadRequest("invalid email format")
	}
	if strings.TrimSpace(req.Password) == "" {
		missing = append(missing, "password")
	}
	if len(missing) > 0 {
		return apperror.BadRequest(fmt.Sprintf("field wajib diisi: %s", strings.Join(missing, ", ")))
	}
	return nil
}

func Refresh(req domain.RefreshRequest) error {
	if strings.TrimSpace(req.RefreshToken) == "" {
		return apperror.BadRequest("field wajib diisi: refresh_token")
	}
	return nil
}

func Logout(req domain.LogoutRequest) error {
	if strings.TrimSpace(req.RefreshToken) == "" {
		return apperror.BadRequest("field wajib diisi: refresh_token")
	}
	return nil
}

func isValidEmail(email string) bool {
	email = strings.TrimSpace(email)
	parts := strings.Split(email, "@")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return false
	}
	return true
}
