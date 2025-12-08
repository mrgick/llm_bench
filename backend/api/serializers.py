from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import LLM, LLMResult, UnitTest, LLMUser

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'password']

    def validate(self, attrs):
        # Require password on create
        if self.instance is None and not attrs.get('password'):
            raise serializers.ValidationError({'password': 'Password is required when creating a user.'})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class LLMSerializer(serializers.ModelSerializer):
    class Meta:
        model = LLM
        fields = ['id', 'name', 'openai_link', 'api_token']


class LLMResultSerializer(serializers.ModelSerializer):
    llm = serializers.PrimaryKeyRelatedField(queryset=LLM.objects.all())

    class Meta:
        model = LLMResult
        fields = ['id', 'llm', 'result', 'difficulty', 'created_at']


class UnitTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitTest
        fields = ['id', 'name', 'difficulty', 'prompt', 'tests']


class LLMUserSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    llm = serializers.PrimaryKeyRelatedField(queryset=LLM.objects.all())

    class Meta:
        model = LLMUser
        fields = ['id', 'llm', 'user', 'token']
