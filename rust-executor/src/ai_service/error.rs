use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub enum AIServiceError {
    DatabaseError(String),
    TaskNotFound,
    StreamNotFound,
    ServiceNotInitialized,
    #[allow(dead_code)]
    LockError,
    CrazyError(String),
    ModelNotFound,
}

impl Error for AIServiceError {}

impl fmt::Display for AIServiceError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AIServiceError::DatabaseError(msg) => write!(f, "Database error: {}", msg),
            AIServiceError::TaskNotFound => write!(f, "Task not found"),
            AIServiceError::ServiceNotInitialized => write!(f, "Service not initialized"),
            AIServiceError::LockError => write!(f, "Lock error"),
            AIServiceError::StreamNotFound => write!(f, "Transcription stream not found"),
            AIServiceError::CrazyError(msg) => write!(f, "Something crazy happened: {}", msg),
            AIServiceError::ModelNotFound => write!(f, "Model not found"),
        }
    }
}
