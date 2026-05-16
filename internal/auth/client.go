package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
)

var ErrUnauthorized = errors.New("unauthorized")

type User struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type Verifier interface {
	Verify(ctx context.Context, token string) (User, error)
}

type Client struct {
	httpClient *http.Client
	baseURL    string
}

func NewClient(httpClient *http.Client, baseURL string) *Client {
	return &Client{
		httpClient: httpClient,
		baseURL:    strings.TrimRight(baseURL, "/"),
	}
}

func (c *Client) Verify(ctx context.Context, token string) (User, error) {
	if token == "" {
		return User{}, ErrUnauthorized
	}
	if c.baseURL == "" {
		return User{}, fmt.Errorf("auth service url is not configured")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/api/auth/me", nil)
	if err != nil {
		return User{}, fmt.Errorf("failed to create auth request: %w", err)
	}
	req.AddCookie(&http.Cookie{Name: "token", Value: token})

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return User{}, fmt.Errorf("auth service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return User{}, ErrUnauthorized
		}
		return User{}, fmt.Errorf("auth service returned status %d", resp.StatusCode)
	}

	var payload struct {
		User map[string]any `json:"user"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return User{}, fmt.Errorf("failed to decode auth response: %w", err)
	}

	user := User{
		ID:    toString(payload.User["id"]),
		Email: toString(payload.User["email"]),
		Role:  toString(payload.User["role"]),
	}
	if user.ID == "" {
		return User{}, fmt.Errorf("auth response does not include user id")
	}

	return user, nil
}

func (c *Client) Register(ctx context.Context, payload []byte) (int, []byte, error) {
	return c.forwardAuthRequest(ctx, http.MethodPost, "/api/auth/register", payload)
}

func (c *Client) Login(ctx context.Context, payload []byte) (string, int, []byte, error) {
	if c.baseURL == "" {
		return "", 0, nil, fmt.Errorf("auth service url is not configured")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/auth/login", bytes.NewReader(payload))
	if err != nil {
		return "", 0, nil, fmt.Errorf("failed to create auth login request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", 0, nil, fmt.Errorf("auth service unavailable: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", 0, nil, fmt.Errorf("failed to read auth response: %w", err)
	}

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return "", resp.StatusCode, body, nil
	}

	for _, cookie := range resp.Cookies() {
		if cookie.Name == "token" {
			return cookie.Value, resp.StatusCode, body, nil
		}
	}

	return "", http.StatusBadGateway, nil, fmt.Errorf("auth login did not return token cookie")
}

func (c *Client) Logout(ctx context.Context, token string) (int, []byte, error) {
	if c.baseURL == "" {
		return 0, nil, fmt.Errorf("auth service url is not configured")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/auth/logout", nil)
	if err != nil {
		return 0, nil, fmt.Errorf("failed to create auth logout request: %w", err)
	}
	if token != "" {
		req.AddCookie(&http.Cookie{Name: "token", Value: token})
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return 0, nil, fmt.Errorf("auth service unavailable: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, nil, fmt.Errorf("failed to read auth response: %w", err)
	}

	return resp.StatusCode, body, nil
}

func (c *Client) forwardAuthRequest(ctx context.Context, method, path string, payload []byte) (int, []byte, error) {
	if c.baseURL == "" {
		return 0, nil, fmt.Errorf("auth service url is not configured")
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, bytes.NewReader(payload))
	if err != nil {
		return 0, nil, fmt.Errorf("failed to create auth request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return 0, nil, fmt.Errorf("auth service unavailable: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, nil, fmt.Errorf("failed to read auth response: %w", err)
	}

	return resp.StatusCode, body, nil
}

func toString(value any) string {
	if value == nil {
		return ""
	}

	return fmt.Sprint(value)
}
