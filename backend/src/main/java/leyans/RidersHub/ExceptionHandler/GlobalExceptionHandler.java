package leyans.RidersHub.ExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;
import leyans.RidersHub.Utility.AppLogger;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

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

    @ExceptionHandler({ IOException.class, AsyncRequestNotUsableException.class })
    public void handleClientDisconnect(Exception e, HttpServletRequest request) {
        // Client closed the connection (app backgrounded, network switch, etc.)
        // Nothing to recover — just log quietly instead of as an ERROR.
        AppLogger.debug(this.getClass(), "Client disconnected during stream",
                "path", request.getRequestURI(), "reason", e.getMessage());
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
        String accept = request.getHeader("Accept");
        boolean isEventStream = "text/event-stream".equals(request.getContentType())
                || (accept != null && accept.contains("text/event-stream"));

        if (isEventStream) {
            // Client disconnected mid-stream (app backgrounded, network switch, etc.)
            // Expected and non-fatal — log quietly instead of as an ERROR.
            log.debug("Client disconnected during stream at {} {}: {}",
                    request.getMethod(), request.getRequestURI(), ex.getMessage());
            return null;
        }

        log.error("[GlobalExceptionHandler] Unhandled exception at {} {}: {}",
                request.getMethod(), request.getRequestURI(), ex.getMessage(), ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorBody("Unexpected server error", HttpStatus.INTERNAL_SERVER_ERROR));
    }
    
    @ExceptionHandler(org.springframework.web.context.request.async.AsyncRequestTimeoutException.class)
    public ResponseEntity<?> handleAsyncTimeout(
            org.springframework.web.context.request.async.AsyncRequestTimeoutException ex,
            HttpServletRequest request) {
        // Expected for SSE streams once they hit their configured emitter timeout —
        // the client auto-reconnects, so this isn't a real error. Log quietly instead
        // of screaming ERROR for normal, by-design behavior.
        log.debug("Async/SSE timeout (expected) at {} {}", request.getMethod(), request.getRequestURI());
        return null;
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