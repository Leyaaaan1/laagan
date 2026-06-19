package leyans.RidersHub.ExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;
import leyans.RidersHub.Utility.AppLogger;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private Map<String, Object> buildErrorBody(String message, HttpStatus status) {
        Map<String, Object> error = new HashMap<>();
        error.put("timestamp", LocalDateTime.now());
        error.put("status", status.value());
        error.put("error", status.getReasonPhrase());
        error.put("message", message);
        return error;
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(buildErrorBody(ex.getMessage(), HttpStatus.NOT_FOUND));
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<?> handleInvalidRequest(InvalidRequestException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildErrorBody(ex.getMessage(), HttpStatus.BAD_REQUEST));
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<?> handleUnauthorized(UnauthorizedAccessException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(buildErrorBody(ex.getMessage(), HttpStatus.UNAUTHORIZED));
    }

    @ExceptionHandler(RideAuthorizationException.class)
    public ResponseEntity<?> handleRideAuthorizationException(RideAuthorizationException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(buildErrorBody(ex.getMessage(), HttpStatus.FORBIDDEN));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex, HttpServletRequest request) {
        log.error("[GlobalExceptionHandler] Unhandled exception at {} {}: {}",
                request.getMethod(), request.getRequestURI(), ex.getMessage(), ex);

        String accept = request.getHeader("Accept");
        boolean isEventStream = "text/event-stream".equals(request.getContentType())
                || (accept != null && accept.contains("text/event-stream"));
        if (isEventStream) {
            return null;
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorBody("Unexpected server error", HttpStatus.INTERNAL_SERVER_ERROR));
    }
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationException(
            org.springframework.web.bind.MethodArgumentNotValidException ex) {

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("error", "Validation Failed");

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );
        response.put("errors", errors);

        return ResponseEntity.badRequest().body(response);
    }


    @ExceptionHandler(RedisUnavailableException.class)
    public ResponseEntity<?> handleRedisUnavailable(RedisUnavailableException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(buildErrorBody("Redis service temporarily unavailable. Please try again.", HttpStatus.SERVICE_UNAVAILABLE));
    }
}