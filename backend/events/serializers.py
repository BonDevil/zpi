import uuid
from rest_framework import serializers
from accounts.models import AppUser
from .models import Event, EventNotification, EventRegistration, Category, Comment, GuestRegistration
from .tasks import send_verification_email

# Serializer for the Event model
class EventSerializer(serializers.ModelSerializer):
    # Serializer fields for categories and additional calculated fields
    categories = serializers.SlugRelatedField(
        many=True,  # Multiple categories per event
        slug_field='name',  # Use the 'name' field of Category model
        queryset=Category.objects.all(),  # Queryset for Category objects
        required=False  # Not required for Event creation
    )
    user_email = serializers.SerializerMethodField()  # Custom field to get user's email
    remaining_slots = serializers.SerializerMethodField()  # Custom field to calculate remaining slots

    class Meta:
        model = Event
        # Fields to be included in the serialized output
        fields = ('id', 'title', 'description', 'location', 'is_public', 'price', 'capacity', 'remaining_slots',
                  'registration_end_date', 'start_date', 'end_date', 'created_at', 'updated_at',
                  'user', 'user_email', 'categories', 'photo')
        read_only_fields = ('user', 'user_email',)  # Make certain fields read-only

    # Method to get user's email
    def get_user_email(self, obj):
        user = AppUser.objects.get(user_id=obj.user_id)
        return user.email

    # Method to calculate remaining slots for the event
    def get_remaining_slots(self, obj):
        if obj.capacity is not None:
            # Count the number of registered users
            registrations = EventRegistration.objects.filter(event_id=obj.id, is_registered=True)
            return obj.capacity - len(registrations)  # Subtract from total capacity
        else:
            return None


# Serializer for the EventNotification model
class EventNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventNotification
        fields = '__all__'  # Include all fields from the model


# Serializer for the EventRegistration model
class EventRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRegistration
        # Fields to be included in the serialized output
        fields = ('id', 'event', 'event_detail', 'is_registered', 'user_email',
                  'registration_date', 'updated_at')

    user_email = serializers.SerializerMethodField(read_only=True)  # Custom field for user's email
    event_detail = EventSerializer(source='event', read_only=True)  # Nested serialization of event details

    # Method to get user's email
    def get_user_email(self, obj):
        user = AppUser.objects.get(user_id=obj.user_id)
        return user.email


# Serializer for the Category model
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('name', 'id')  # Include only name and id fields


# Serializer for the Comment model
class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = '__all__'  # Include all fields from the model


# Serializer for listing categories by name
class CategoryNameListSerializer(serializers.Serializer):
    name = serializers.CharField()  # Field for category name


# Serializer for the GuestRegistration model
class GuestRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuestRegistration
        fields = ['email', 'event']  # Fields to include in the serialized output

    def create(self, validated_data):
        # Method to handle creation of GuestRegistration object
        # Generate a unique verification code
        verification_code = uuid.uuid4().hex
        # Create a GuestRegistration instance with the given data and the generated verification code
        guest_registration = GuestRegistration.objects.create(
            verification_code=verification_code,
            **validated_data
        )
        # Send a verification email using a Celery task
        send_verification_email.delay(
            guest_registration.email,
            guest_registration.verification_code,
            guest_registration.event_id
        )
        return guest_registration
