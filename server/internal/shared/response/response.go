package response

type Envelope struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *Error      `json:"error,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
}

type Error struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type Meta struct {
	Page       int   `json:"page,omitempty"`
	PageSize   int   `json:"page_size,omitempty"`
	TotalItems int64 `json:"total_items,omitempty"`
	TotalPages int   `json:"total_pages,omitempty"`
}

func OK(data interface{}) Envelope {
	return Envelope{Success: true, Data: data}
}

func Created(data interface{}) Envelope {
	return Envelope{Success: true, Data: data}
}

func Err(code, message string) Envelope {
	return Envelope{
		Success: false,
		Error:   &Error{Code: code, Message: message},
	}
}

func WithMeta(data interface{}, page, pageSize int, totalItems int64) Envelope {
	totalPages := int((totalItems + int64(pageSize) - 1) / int64(pageSize))
	return Envelope{
		Success: true,
		Data:    data,
		Meta: &Meta{
			Page:       page,
			PageSize:   pageSize,
			TotalItems: totalItems,
			TotalPages: totalPages,
		},
	}
}
