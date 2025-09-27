def get_version() -> str:
    """Get the current version of the application."""
    return "0.1.0"


def format_response(data: dict, success: bool = True) -> dict:
    """Format API response in a consistent way."""
    return {
        "success": success,
        "data": data if success else None,
        "error": None if success else data.get("message", "Unknown error")
    }


def validate_email(email: str) -> bool:
    """Simple email validation."""
    return "@" in email and "." in email.split("@")[1]