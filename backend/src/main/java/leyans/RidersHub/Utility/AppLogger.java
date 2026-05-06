
package leyans.RidersHub.Utility;

import leyans.RidersHub.ExceptionHandler.InvalidRequestException;
import leyans.RidersHub.ExceptionHandler.ResourceNotFoundException;
import leyans.RidersHub.ExceptionHandler.UnauthorizedAccessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** * Centralized Logger Utility for the entire application. * 
 * Usage: *   AppLogger.info(this.getClass(), "User created", "userId", userId); *   AppLogger.error(this.getClass(), "Database error", exception); *   AppLogger.warn(this.getClass(), "Duplicate request detected"); */
@Component
public class AppLogger {

    /**     * Log informational message (success, normal flow)     * 
     * @param clazz The calling class (use this.getClass())     * @param message The log message     * @param args Optional key-value pairs: "key1", value1, "key2", value2, ...     */
    public static void info(Class<?> clazz, String message, Object... args) {
        Logger logger = LoggerFactory.getLogger(clazz);
        if (args.length == 0) {
            logger.info(message);
        } else {
            logger.info(formatMessage(message, args));
        }
    }

    /**     * Log warning message (unusual situation, could be problematic)     * 
     * @param clazz The calling class     * @param message The log message     * @param args Optional key-value pairs     */
    public static void warn(Class<?> clazz, String message, Object... args) {
        Logger logger = LoggerFactory.getLogger(clazz);
        if (args.length == 0) {
            logger.warn(message);
        } else {
            logger.warn(formatMessage(message, args));
        }
    }

    /**     * Log error message (something failed)     * 
     * @param clazz The calling class     * @param message The log message     * @param exception The exception object     */
    public static void error(Class<?> clazz, String message, Exception exception) {
        Logger logger = LoggerFactory.getLogger(clazz);
        logger.error(message, exception);
    }

    /**     * Log error message with context     * 
     * @param clazz The calling class     * @param message The log message     * @param args Optional key-value pairs, last element can be Exception     */
    public static void error(Class<?> clazz, String message, Object... args) {
        Logger logger = LoggerFactory.getLogger(clazz);
        Exception exception = null;
        Object[] logArgs = args;

        // Check if last argument is an Exception
        if (args.length > 0 && args[args.length - 1] instanceof Exception) {
            exception = (Exception) args[args.length - 1];
            logArgs = new Object[args.length - 1];
            System.arraycopy(args, 0, logArgs, 0, args.length - 1);
        }

        if (exception != null) {
            logger.error(formatMessage(message, logArgs), exception);
        } else {
            logger.error(formatMessage(message, args));
        }
    }

    /**     * Log debug message (diagnostic info, only in dev)     * 
     * @param clazz The calling class     * @param message The log message     * @param args Optional key-value pairs     */
    public static void debug(Class<?> clazz, String message, Object... args) {
        Logger logger = LoggerFactory.getLogger(clazz);
        if (logger.isDebugEnabled()) {
            if (args.length == 0) {
                logger.debug(message);
            } else {
                logger.debug(formatMessage(message, args));
            }
        }
    }

    /**     * Throw InvalidRequestException with logging     * 
     * @param clazz The calling class     * @param message The error message to log and throw     */
    public static void throwInvalidRequest(Class<?> clazz, String message) {
        AppLogger.warn(clazz, "Invalid request: {}", message);
        throw new InvalidRequestException(message);
    }

    /**     * Throw InvalidRequestException with logging and cause     * 
     * @param clazz The calling class     * @param message The error message     * @param cause The exception cause     */
    public static void throwInvalidRequest(Class<?> clazz, String message, Exception cause) {
        AppLogger.error(clazz, "Invalid request: " + message, cause);
        throw new InvalidRequestException(message);
    }

    /**     * Throw ResourceNotFoundException with logging     * 
     * @param clazz The calling class     * @param message The error message to log and throw     */
    public static void throwResourceNotFound(Class<?> clazz, String message) {
        AppLogger.warn(clazz, "Resource not found: {}", message);
        throw new ResourceNotFoundException(message);
    }

    /**     * Throw ResourceNotFoundException with logging and cause     * 
     * @param clazz The calling class     * @param message The error message     * @param cause The exception cause     */
    public static void throwResourceNotFound(Class<?> clazz, String message, Exception cause) {
        AppLogger.error(clazz, "Resource not found: " + message, cause);
        throw new ResourceNotFoundException(message);
    }

    /**     * Throw UnauthorizedAccessException with logging     * 
     * @param clazz The calling class     * @param message The error message to log and throw     */
    public static void throwUnauthorized(Class<?> clazz, String message) {
        AppLogger.warn(clazz, "Unauthorized access: {}", message);
        throw new UnauthorizedAccessException(message);
    }

    /**     * Throw UnauthorizedAccessException with logging and cause     * 
     * @param clazz The calling class     * @param message The error message     * @param cause The exception cause     */
    public static void throwUnauthorized(Class<?> clazz, String message, Exception cause) {
        AppLogger.error(clazz, "Unauthorized access: " + message, cause);
        throw new UnauthorizedAccessException(message);
    }

    /**     * Format message with key-value pairs     * Input: "User registered", "username", "john", "email", "john@test.com"     * Output: "User registered [username=john, email=john@test.com]"     */
    private static String formatMessage(String message, Object... args) {
        if (args.length == 0) {
            return message;
        }

        StringBuilder formatted = new StringBuilder(message).append(" [");
        for (int i = 0; i < args.length; i += 2) {
            if (i > 0) formatted.append(", ");
            if (i + 1 < args.length) {
                formatted.append(args[i]).append("=").append(args[i + 1]);
            } else {
                formatted.append(args[i]);
            }
        }
        formatted.append("]");
        return formatted.toString();
    }
}