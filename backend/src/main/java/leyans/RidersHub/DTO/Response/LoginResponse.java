package leyans.RidersHub.DTO.Response;

public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private String username;
    private boolean onboardingCompleted;

    public LoginResponse(String accessToken, String refreshToken, String username, boolean onboardingCompleted) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.username = username;
        this.onboardingCompleted = onboardingCompleted;
    }

    public boolean isOnboardingCompleted() { return onboardingCompleted; }
    public void setOnboardingCompleted(boolean onboardingCompleted) { this.onboardingCompleted = onboardingCompleted; }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAccessToken() { return accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public String getTokenType() { return tokenType; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
}