package apperror

import "fmt"

type AppError struct {
	Code       string
	Message    string
	Err        error
	HTTPStatus int
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s (%v)", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

func NotFound(msg string) *AppError {
	return &AppError{Code: "NOT_FOUND", Message: msg, HTTPStatus: 404}
}

func BadRequest(msg string) *AppError {
	return &AppError{Code: "BAD_REQUEST", Message: msg, HTTPStatus: 400}
}

func Unauthorized(msg string) *AppError {
	return &AppError{Code: "UNAUTHORIZED", Message: msg, HTTPStatus: 401}
}

func Forbidden(msg string) *AppError {
	return &AppError{Code: "FORBIDDEN", Message: msg, HTTPStatus: 403}
}

func Internal(msg string, err error) *AppError {
	return &AppError{Code: "INTERNAL", Message: msg, Err: err, HTTPStatus: 500}
}

func Conflict(msg string) *AppError {
	return &AppError{Code: "CONFLICT", Message: msg, HTTPStatus: 409}
}
