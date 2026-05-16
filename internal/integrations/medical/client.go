package medical

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
)

var ErrPatientNotFound = errors.New("patient not found")

type Doctor struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Department string `json:"department"`
}

type Patient struct {
	ID string `json:"id"`
}

type Client struct {
	httpClient          *http.Client
	baseURL             string
	doctorsPath         string
	patientPathTemplate string
}

func NewClient(httpClient *http.Client, baseURL, doctorsPath, patientPathTemplate string) *Client {
	return &Client{
		httpClient:          httpClient,
		baseURL:             strings.TrimRight(baseURL, "/"),
		doctorsPath:         withDefaultPath(doctorsPath, "/doctors"),
		patientPathTemplate: withDefaultPath(patientPathTemplate, "/patients/%s"),
	}
}

func (c *Client) ListDoctors(ctx context.Context) ([]Doctor, error) {
	if c.baseURL == "" {
		return nil, fmt.Errorf("medical records url is not configured")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+c.doctorsPath, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create medical records request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("medical records service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("medical records service returned status %d", resp.StatusCode)
	}

	var rawDoctors []map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&rawDoctors); err != nil {
		return nil, fmt.Errorf("failed to decode doctors response: %w", err)
	}

	doctors := make([]Doctor, 0, len(rawDoctors))
	for _, raw := range rawDoctors {
		id := valueOr(raw, "id", "doctorId", "doctor_id")
		if id == "" {
			continue
		}

		name := valueOr(raw, "name", "doctorName", "doctor_name")
		if name == "" {
			firstName := valueOr(raw, "firstName", "first_name")
			lastName := valueOr(raw, "lastName", "last_name")
			name = strings.TrimSpace(firstName + " " + lastName)
		}

		doctors = append(doctors, Doctor{
			ID:         id,
			Name:       name,
			Department: valueOr(raw, "department"),
		})
	}

	return doctors, nil
}

func (c *Client) GetPatient(ctx context.Context, patientID string) (Patient, error) {
	if c.baseURL == "" {
		return Patient{}, fmt.Errorf("medical records url is not configured")
	}

	url := c.baseURL + fmt.Sprintf(c.patientPathTemplate, patientID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return Patient{}, fmt.Errorf("failed to create medical records request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return Patient{}, fmt.Errorf("medical records service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return Patient{}, ErrPatientNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return Patient{}, fmt.Errorf("medical records service returned status %d", resp.StatusCode)
	}

	var raw map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return Patient{}, fmt.Errorf("failed to decode patient response: %w", err)
	}

	id := valueOr(raw, "id", "patientId", "patient_id")
	if id == "" {
		id = patientID
	}

	return Patient{ID: id}, nil
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

func valueOr(values map[string]any, keys ...string) string {
	for _, key := range keys {
		value, ok := values[key]
		if !ok || value == nil {
			continue
		}
		return fmt.Sprint(value)
	}

	return ""
}
