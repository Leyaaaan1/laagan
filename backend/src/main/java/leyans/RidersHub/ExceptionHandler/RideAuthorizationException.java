
package leyans.RidersHub.ExceptionHandler;

/** * Thrown when a user attempts to perform an operation they're not authorized for. * Examples: non-creator trying to start a ride, unauthorized participant access. * 
 * Maps to HTTP 403 Forbidden in GlobalExceptionHandler. */
public class RideAuthorizationException extends RuntimeException {

    public RideAuthorizationException(String message) {
        super(message);
    }

    public RideAuthorizationException(String message, Throwable cause) {
        super(message, cause);
    }
}