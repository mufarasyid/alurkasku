package validate

import (
	"fmt"
	"strings"

	"github.com/mufarasyid/alurkasku/server/internal/modules/user/domain"
	"github.com/mufarasyid/alurkasku/server/internal/shared/apperror"
)

func CreateUser(req domain.CreateUserRequest) error {
	var missing []string
	if strings.TrimSpace(req.Name) == "" {
		missing = append(missing, "name")
	} else if len(strings.TrimSpace(req.Name)) < 2 {
		return apperror.BadRequest("name must be at least 2 characters")
	}
	if strings.TrimSpace(req.Email) == "" {
		missing = append(missing, "email")
	} else if !isValidEmail(req.Email) {
		return apperror.BadRequest("invalid email format")
	}
	if strings.TrimSpace(req.Password) == "" {
		missing = append(missing, "password")
	} else if len(req.Password) < 8 {
		return apperror.BadRequest("password must be at least 8 characters")
	}
	if len(missing) > 0 {
		return apperror.BadRequest(fmt.Sprintf("field wajib diisi: %s", strings.Join(missing, ", ")))
	}
	return nil
}

func UpdateUser(req domain.UpdateUserRequest) error {
	hasUpdate := false
	if strings.TrimSpace(req.Name) != "" {
		hasUpdate = true
		if len(strings.TrimSpace(req.Name)) < 2 {
			return apperror.BadRequest("name must be at least 2 characters")
		}
	}
	if strings.TrimSpace(req.Email) != "" {
		hasUpdate = true
		if !isValidEmail(req.Email) {
			return apperror.BadRequest("invalid email format")
		}
	}
	if !hasUpdate {
		return apperror.BadRequest("no fields to update")
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
