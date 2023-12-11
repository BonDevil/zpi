# Import necessary libraries and modules
import logging
from smtplib import SMTPServerDisconnected
from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone
from events.mailing_system import send_notification
from events.models import Event, EventRegistration, GuestRegistration

# Configure logging for this module
logger = logging.getLogger(__name__)


@shared_task
def send_event_notifications():
    """
    Celery task to send notifications for upcoming events.
    """
    try:
        # Get the current time
        current_time = timezone.now()
        # Find events that are starting within the next 24 hours
        upcoming_events = Event.objects.filter(
            start_date__range=(current_time, current_time + timezone.timedelta(hours=24))
        )

        # Loop through each upcoming event
        for event in upcoming_events:
            # Get registered users for each event
            registered_users = EventRegistration.objects.filter(
                event=event,
                is_registered=True
            ).select_related('user')

            # Get emails of verified guest registrations
            guest_emails = list(
                GuestRegistration.objects.filter(event=event, verified=True).values_list('email', flat=True))

            # Compile a list of all emails to notify
            emails = [registration.user.email for registration in registered_users]
            emails = emails + guest_emails

            # Send a notification email about the event
            send_notification(emails, f'Upcoming Event: {event.title}',
                              f'Reminder: The event "{event.title}" is starting soon!')
    except SMTPServerDisconnected as e:
        # Log an error if email sending fails
        logger.error(f"Failed to send email: {e}")


@shared_task
def send_verification_email(email, verification_code, event_id=None, user_id=None, retry_count=0):
    """
    Celery task to send an email for account or guest registration verification.
    """
    # Construct the email verification link based on whether it's for event registration or account verification
    if event_id is None:
        verification_link = f"http://127.0.0.1:8000/api/accounts/verify-registration?code={verification_code}&user_id={user_id}"
    else:
        verification_link = f"http://127.0.0.1:8000/api/verify-guest-registration?code={verification_code}&event_id={event_id}"

    try:
        # Send the verification email
        send_mail(
            'Verify Your Event Registration',
            f'Please click the following link to verify your email and complete the registration: {verification_link}',
            'from@example.com',
            [email],
            fail_silently=False,
        )
    except SMTPServerDisconnected as e:
        # Log an error and retry if email sending fails, up to 3 times
        logger.error(f"Failed to send email: {e}")
        if retry_count < 3:
            send_verification_email(email, verification_code, event_id, user_id, retry_count + 1)
        else:
            # Log an error if maximum retries are reached
            logger.error("Max retries reached for sending email.")
            # Additional error handling or user notification can be added here
