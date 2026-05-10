package leyans.RidersHub.Config.Security;

import leyans.RidersHub.Config.JWT.JwtFilter;
import leyans.RidersHub.Service.UserDetailsManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/riders/login",
                                "/riders/register",
                                "/riders/refresh",
                                "/riders/facebook-login"  // ← new SDK endpoint, no OAuth2 flow
                        ).permitAll()
                        .requestMatchers(
                                "/rides/*/start",
                                "/riders/rider-type",
                                "/riders/all",
                                "/riders/add",
                                "/riders/create",
                                "/riders/search",
                                "/riders/*/start",
                                "/rides/**",
                                "/riders/**",
                                "/riders/current-rider-type",
                                "/location/**",
                                "/participants/**",
                                "/riders/*/map-image",
                                "/update/**",
                                "/start/**",
                                "/wikimedia",
                                "/routes",
                                "/invite/**",
                                "/join/**",
                                "/join-request/**",
                                "/invite-request/**",
                                "/profiles/**",
                                "/update"
                        ).authenticated()
                        .anyRequest().authenticated()
                )
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                // ✅ oauth2Login removed — no longer needed.
                // The Facebook SDK sends a token directly to /riders/facebook-login.
                // Spring verifies it via Facebook Graph API — no browser redirect flow.
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(UserDetailsManager userDetailsManager,
                                                       PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider();
        authenticationProvider.setUserDetailsService(userDetailsManager);
        authenticationProvider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(authenticationProvider);
    }
}