package notification

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type AppointmentPayload struct {
	ID              uint      `json:"id"`
	PatientID       string    `json:"patientId"`
	DoctorID        string    `json:"doctorId"`
	Department      string    `json:"department"`
	AppointmentDate time.Time `json:"appointmentDate"`
	Status          string    `json:"status"`
}

type Client struct {
	httpClient *http.Client
	baseURL    string
	path       string
}

func NewClient(httpClient *http.Client, baseURL, path string) *Client {
	return &Client{
		httpClient: httpClient,
		baseURL:    strings.TrimRight(baseURL, "/"),
		path:       withDefaultPath(path, "/notifications/appointments"),
	}
}

func (c *Client) SendAppointmentEvent(ctx context.Context, event string, appointment AppointmentPayload) error {
	if c.baseURL == "" {
		return fmt.Errorf("notification service url is not configured")
	}

	body, err := json.Marshal(map[string]any{
		"event":       event,
		"appointment": appointment,
	})
	if err != nil {
		return fmt.Errorf("failed to encode notification payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+c.path, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create notification request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("notification service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("notification service returned status %d", resp.StatusCode)
	}

	return nil
}

func withDefaultPath(path, fallback string) string {
	if path == "" {
		return fallback
	}
	if strings.HasPrefix(path, "/") {
		return path
	}
	return "/" + path
}
